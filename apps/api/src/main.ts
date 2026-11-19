import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import { loadEnv } from "@lean/config";

import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api/v1");
  app.enableShutdownHooks();
  await app.listen(env.API_PORT);
}

void bootstrap();
