import type { ILogger, LogContext } from '../../business/ports/ILogger';

type LogLevel = 'info' | 'warn' | 'error';

/**
 * Emits one JSON object per line so logs stay machine-readable in Docker.
 */
export function createConsoleLogger(scope: string): ILogger {
  const write = (level: LogLevel) => (event: string, context: LogContext = {}): void => {
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      scope,
      event,
      ...context,
    });

    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  };

  return {
    info: write('info'),
    warn: write('warn'),
    error: write('error'),
  };
}

export function createSilentLogger(): ILogger {
  const noop = (): void => undefined;
  return { info: noop, warn: noop, error: noop };
}
