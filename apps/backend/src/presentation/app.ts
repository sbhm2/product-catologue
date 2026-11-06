import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { ILogger } from '../business/ports/ILogger';
import type { CatalogService } from '../business/services/CatalogService';
import type { EnquiryService } from '../business/services/EnquiryService';
import { createConsoleLogger } from '../data-access/logging/ConsoleLogger';
import { createErrorHandler, notFoundHandler } from './middleware/errorHandler';
import {
  createCatalogRouter,
  createCategoriesRouter,
  createSearchRouter,
} from './routes/catalogRoutes';
import { createEnquiryRouter } from './routes/enquiryRoutes';

export interface CreateAppOptions {
  catalogService: CatalogService;
  enquiryService: EnquiryService;
  logger?: ILogger;
  /** Allowed browser origins. `'*'` (the default) accepts any origin. */
  corsOrigins?: string[] | '*';
}

/**
 * Presentation composition: HTTP concerns only. Dependencies are injected so
 * tests can mount the app with stub services.
 */
export function createApp(options: CreateAppOptions): Express {
  const logger = options.logger ?? createConsoleLogger('http');
  const allowedOrigins = options.corsOrigins ?? '*';

  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: allowedOrigins === '*' ? true : allowedOrigins,
      methods: ['GET', 'POST', 'OPTIONS'],
    }),
  );
  app.use(express.json({ limit: '32kb' }));

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ data: { status: 'ok', uptimeSeconds: Math.round(process.uptime()) } });
  });

  app.use('/api/products', createCatalogRouter(options.catalogService));
  app.use('/api/categories', createCategoriesRouter(options.catalogService));
  app.use('/api/search', createSearchRouter(options.catalogService));
  app.use('/api/enquiries', createEnquiryRouter(options.enquiryService));

  app.use(notFoundHandler);
  app.use(createErrorHandler(logger));

  return app;
}
