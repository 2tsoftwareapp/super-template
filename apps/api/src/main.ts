import "reflect-metadata";

import type { NestExpressApplication } from "@nestjs/platform-express";

import { ConsoleLogger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { loadEnv } from "@lean/config";

import { AppModule } from "./app.module";
import { configureApp } from "./app-setup";

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // JSON lines in production for log shippers; coloured text locally.
    logger: new ConsoleLogger({ json: env.NODE_ENV === "production" }),
  });

  // Login throttling keys on the client IP the admin BFF forwards.
  app.set("trust proxy", env.TRUST_PROXY);
  configureApp(app, { corsOrigins: env.CORS_ORIGINS, requestLog: true });
  app.enableShutdownHooks();
  await app.listen(env.API_PORT);
}

void bootstrap();
