import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { loadEnv } from "@lean/config";

import { AppModule } from "./app.module";
import { AppExceptionFilter } from "./shared/app-exception.filter";

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new AppExceptionFilter());
  app.enableShutdownHooks();
  await app.listen(env.API_PORT);
}

void bootstrap();
