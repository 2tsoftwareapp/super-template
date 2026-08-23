import { NestFactory } from "@nestjs/core";

import { AppModule } from "../app.module";
import { loadCliEnv } from "./load-cli-env";
import { seedDatabase } from "./seeds/seed-data";

loadCliEnv();

const main = async (): Promise<void> => {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn"],
  });

  try {
    await seedDatabase(app);
  } finally {
    await app.close();
  }
};

void main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
