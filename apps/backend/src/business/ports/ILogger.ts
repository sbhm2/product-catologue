export type LogContext = Record<string, unknown>;

export interface ILogger {
  info(event: string, context?: LogContext): void;
  warn(event: string, context?: LogContext): void;
  error(event: string, context?: LogContext): void;
}
