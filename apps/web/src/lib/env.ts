import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

loadEnv({ path: resolve(process.cwd(), ".env"), quiet: true });
loadEnv({ path: resolve(process.cwd(), "../../.env"), quiet: true });

const envSchema = z.object({
  API_INTERNAL_URL: z.url(),
  NEXT_PUBLIC_WEB_URL: z.url(),
  WEB_ORIGIN: z.url(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export const env = envSchema.parse({
  API_INTERNAL_URL: process.env.API_INTERNAL_URL,
  NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
  WEB_ORIGIN: process.env.WEB_ORIGIN,
  NODE_ENV: process.env.NODE_ENV,
});

export const isSecureCookie = env.NODE_ENV === "production";
