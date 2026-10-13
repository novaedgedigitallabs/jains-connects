import { z } from 'zod';

const supportedDatabaseProtocols = new Set(['postgres:', 'postgresql:']);

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  HOST: z.string().trim().min(1).default('127.0.0.1'),
  SESSION_TTL_SECONDS: z.coerce.number().int().min(900).max(2_592_000).default(604_800),
  DATABASE_URL: z
    .string()
    .trim()
    .url()
    .refine((value) => supportedDatabaseProtocols.has(new URL(value).protocol), {
      message: 'must use the postgres:// or postgresql:// protocol',
    }),
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().url())),
});

export type AppConfig = {
  nodeEnv: 'development' | 'test' | 'staging' | 'production';
  port: number;
  host: string;
  sessionTtlSeconds: number;
  databaseUrl: string;
  corsOrigins: string[];
};

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = environmentSchema.safeParse(environment);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
      .join('; ');

    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return {
    nodeEnv: parsed.data.NODE_ENV,
    port: parsed.data.PORT,
    host: parsed.data.HOST,
    sessionTtlSeconds: parsed.data.SESSION_TTL_SECONDS,
    databaseUrl: parsed.data.DATABASE_URL,
    corsOrigins: parsed.data.CORS_ORIGINS,
  };
}
