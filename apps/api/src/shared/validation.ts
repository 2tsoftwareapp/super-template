import type { Type } from "@nestjs/common";

import { ValidationPipe } from "@nestjs/common";

/**
 * tsx/esbuild emit no decorator metadata, so a global pipe cannot see DTO
 * types. Every `@Body()`/`@Query()` names its DTO through this one factory.
 */
export const validate = (expectedType: Type<unknown>): ValidationPipe =>
  new ValidationPipe({
    expectedType,
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });
