import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import { loadEnv } from "@lean/config";

import { AppModule } from "./app.module";
import { configureApp } from "./app-setup";

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule);

  configureApp(app);
  app.enableShutdownHooks();
  await app.listen(env.API_PORT);
}

void bootstrap();
