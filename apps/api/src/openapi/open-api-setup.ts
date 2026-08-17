import type { INestApplication } from "@nestjs/common";
import type { EnvironmentService } from "@repo/api-core";

import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export const openApiSetup = (app: INestApplication, environmentService: EnvironmentService) => {
  if (environmentService.apiDocsEnabled && !environmentService.isProduction) {
    const config = new DocumentBuilder()
      .setTitle("Super Template API")
      .setDescription("Production-oriented starter API")
      .setVersion("1.0.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);
    app
      .getHttpAdapter()
      .get("/api/docs-json", (_request: unknown, response: { json: (body: unknown) => void }) => {
        response.json(document);
      });
  }
};
