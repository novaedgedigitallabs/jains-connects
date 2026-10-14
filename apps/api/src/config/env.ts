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
  // Optional SMTP config. When absent, emails are logged-only (NoopEmailProvider).
  SMTP_HOST: z.string().trim().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  SMTP_USER: z.string().trim().optional(),
  SMTP_PASS: z.string().trim().optional(),
  SMTP_FROM: z.string().trim().optional(),
  // Used to construct verification/reset links in outgoing emails.
  PUBLIC_SITE_URL: z.string().trim().url().optional(),
  // Base64 32-byte AES-256-GCM key that encrypts TOTP secrets at rest.
  // Mandatory in production because staff access requires MFA.
  MFA_ENCRYPTION_KEY: z.string().trim().min(1).optional(),
});

export type AppConfig = {
  nodeEnv: 'development' | 'test' | 'staging' | 'production';
  port: number;
  host: string;
  sessionTtlSeconds: number;
  databaseUrl: string;
  corsOrigins: string[];
  smtp: {
    host?: string | undefined;
    port: number;
    secure: boolean;
    user?: string | undefined;
    pass?: string | undefined;
    from?: string | undefined;
  };
  publicSiteUrl?: string | undefined;
  mfaEncryptionKey?: string | undefined;
};

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = environmentSchema.safeParse(environment);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
      .join('; ');

    throw new Error(`Invalid environment configuration: ${details}`);
  }

  const nodeEnv = parsed.data.NODE_ENV;
  const mfaEncryptionKey = parsed.data.MFA_ENCRYPTION_KEY;

  // Staff (privileged) access is server-side gated on MFA, so production
  // must be able to encrypt TOTP secrets. Failing fast beats issuing
  // credentials that can never be enrolled.
  if (nodeEnv === 'production' && !mfaEncryptionKey) {
    throw new Error(
      'Invalid environment configuration: MFA_ENCRYPTION_KEY is required when NODE_ENV is production',
    );
  }

  return {
    nodeEnv,
    port: parsed.data.PORT,
    host: parsed.data.HOST,
    sessionTtlSeconds: parsed.data.SESSION_TTL_SECONDS,
    databaseUrl: parsed.data.DATABASE_URL,
    corsOrigins: parsed.data.CORS_ORIGINS,
    smtp: {
      host: parsed.data.SMTP_HOST,
      port: parsed.data.SMTP_PORT,
      secure: parsed.data.SMTP_SECURE ?? false,
      user: parsed.data.SMTP_USER,
      pass: parsed.data.SMTP_PASS,
      from: parsed.data.SMTP_FROM,
    },
    publicSiteUrl: parsed.data.PUBLIC_SITE_URL,
    mfaEncryptionKey,
  };
}
