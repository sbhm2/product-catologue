export interface AppConfig {
  port: number;
  fakeStoreApiUrl: string;
  fakeStoreTimeoutMs: number;
  corsOrigins: string[] | '*';
}

function parsePort(value: string | undefined): number {
  const port = Number(value ?? 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`PORT must be an integer between 1 and 65535, received "${value ?? ''}".`);
  }
  return port;
}

function parseTimeout(value: string | undefined): number {
  const timeout = Number(value ?? 8_000);
  if (!Number.isInteger(timeout) || timeout < 100) {
    throw new Error(`FAKESTORE_TIMEOUT_MS must be an integer of at least 100, received "${value ?? ''}".`);
  }
  return timeout;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const configuredOrigins = (env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return {
    port: parsePort(env.PORT),
    fakeStoreApiUrl: env.FAKESTORE_API_URL ?? 'https://fakestoreapi.com',
    fakeStoreTimeoutMs: parseTimeout(env.FAKESTORE_TIMEOUT_MS),
    corsOrigins: configuredOrigins.length > 0 ? configuredOrigins : '*',
  };
}
