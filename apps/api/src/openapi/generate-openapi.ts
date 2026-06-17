import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { config as loadEnv } from 'dotenv';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { AppModule } from '../app.module';

loadEnv({
  path: resolve(process.cwd(), '.env'),
});

loadEnv({
  path: resolve(process.cwd(), '../../.env.example'),
});

const generate = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule, {
    logger: false,
  });

  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('Super Template API')
    .setDescription('Generated OpenAPI contract')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  await writeFile(
    resolve(process.cwd(), 'openapi.json'),
    JSON.stringify(document, null, 2),
  );
  await app.close();
};

void generate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
