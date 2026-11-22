import { z } from "zod";

const mailShape = {
  SMTP_URL: z.string().url().optional(),
  MAIL_FROM: z.string().min(1).default("no-reply@example.local"),
};

const databaseShape = {
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
};

/**
 * Every variable the API needs. Parsed once at boot: a missing or malformed
 * value fails there, not three layers deep inside a request.
 */
export const envSchema = z.object({
  ...databaseShape,
  ...mailShape,
  API_PORT: z.coerce.number().int().positive().default(3001),
  /** Express `trust proxy`: which hops may set X-Forwarded-For (the admin BFF). */
  TRUST_PROXY: z.string().default("loopback"),
  /** Comma-separated browser origins allowed to call the API directly; empty disables CORS. */
  CORS_ORIGINS: z
    .string()
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  JWT_ACCESS_SECRET: z.string().min(32, "must be at least 32 characters"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("30d"),
  /** Public URL of apps/web: the password-reset mail links to `${WEB_URL}/reset-password`. */
  WEB_URL: z.string().url().default("http://localhost:3000"),
  /** `false` turns off `POST /auth/register`; admins still create users. */
  ALLOW_REGISTRATION: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  STORAGE_DIR: z.string().default("./storage"),
  MAX_UPLOAD_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(5 * 1024 * 1024),
});

/** The worker needs the database and mail settings, not the API's JWT secret. */
export const workerEnvSchema = z.object({ ...databaseShape, ...mailShape });

/** Read lazily by the mail job so a worker without SMTP still runs other jobs. */
export const mailEnvSchema = z.object(mailShape);

export type Env = z.infer<typeof envSchema>;
export type WorkerEnv = z.infer<typeof workerEnvSchema>;
export type MailEnv = z.infer<typeof mailEnvSchema>;

function parseEnv<T extends z.ZodTypeAny>(schema: T, source: NodeJS.ProcessEnv): z.infer<T> {
  const parsed = schema.safeParse(source);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new Error(`Invalid environment: ${details}`);
  }

  return parsed.data;
}

export const loadEnv = (source: NodeJS.ProcessEnv = process.env): Env =>
  parseEnv(envSchema, source);

export const loadWorkerEnv = (source: NodeJS.ProcessEnv = process.env): WorkerEnv =>
  parseEnv(workerEnvSchema, source);

export const loadMailEnv = (source: NodeJS.ProcessEnv = process.env): MailEnv =>
  parseEnv(mailEnvSchema, source);
