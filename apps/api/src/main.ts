import "reflect-metadata";

import type { NestExpressApplication } from "@nestjs/platform-express";

import { NestFactory } from "@nestjs/core";
import { loadEnv } from "@lean/config";

import { AppModule } from "./app.module";
import { configureApp } from "./app-setup";

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Login throttling keys on the client IP the admin BFF forwards.
  app.set("trust proxy", env.TRUST_PROXY);
  configureApp(app);
  app.enableShutdownHooks();
  await app.listen(env.API_PORT);
}

void bootstrap();
