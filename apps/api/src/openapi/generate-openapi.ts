import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../app.module';

const generate = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule, {
    logger: false,
  });

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

void generate();
