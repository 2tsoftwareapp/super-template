import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { loadEnvFiles } from "@repo/env-loader";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { AppModule } from "../app.module";

loadEnvFiles();

/** Recursively sort object keys so OpenAPI output is deterministic across runs. */
const sortKeysDeep = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }

  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort((a, b) => a.localeCompare(b))) {
      sorted[key] = sortKeysDeep(record[key]);
    }
    return sorted;
  }

  return value;
};

const generate = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule, {
    logger: false,
  });

  app.setGlobalPrefix("api/v1");

  const config = new DocumentBuilder()
    .setTitle("Super Template API")
    .setDescription("Generated OpenAPI contract")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const stableDocument = sortKeysDeep(document);
  await writeFile(
    resolve(process.cwd(), "openapi.json"),
    `${JSON.stringify(stableDocument, null, 2)}\n`,
  );
  await app.close();
};
void generate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
