import { ConsoleEmailAdapter } from './data-access/email/ConsoleEmailAdapter';
import { FakeStoreAdapter } from './data-access/fakestore/FakeStoreAdapter';
import { createConsoleLogger } from './data-access/logging/ConsoleLogger';
import { CatalogService } from './business/services/CatalogService';
import { EnquiryService } from './business/services/EnquiryService';
import { createApp } from './presentation/app';
import { loadConfig } from './config';

/**
 * Composition root.
 *
 * This is the only place that knows which concrete adapters are in use. To
 * switch the data source or email provider, construct a different adapter here
 * and keep everything else untouched.
 */
const config = loadConfig();
const logger = createConsoleLogger('backend');

const productRepository = new FakeStoreAdapter({
  baseUrl: config.fakeStoreApiUrl,
  timeoutMs: config.fakeStoreTimeoutMs,
  logger,
});

const emailService = new ConsoleEmailAdapter({ logger });

const catalogService = new CatalogService(productRepository);
const enquiryService = new EnquiryService({ repository: productRepository, emailService });

const app = createApp({
  catalogService,
  enquiryService,
  logger,
  corsOrigins: config.corsOrigins,
});

const server = app.listen(config.port, () => {
  logger.info('server.listening', {
    port: config.port,
    productSource: config.fakeStoreApiUrl,
    emailProvider: 'console',
  });
});

function shutdown(signal: string): void {
  logger.info('server.shutdown_requested', { signal });

  const forceExit = setTimeout(() => {
    logger.error('server.shutdown_timeout');
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  server.close((error) => {
    if (error) {
      logger.error('server.shutdown_failed', { reason: error.message });
      process.exit(1);
    }
    logger.info('server.stopped');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
