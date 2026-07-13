import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import { TEMPLATE_RENDERER_SERVICE, type TemplateRendererServicePort } from '../ports/template-renderer.service.port';

@Injectable()
export class PreviewMailTemplateUseCase {
  constructor(@Inject(TEMPLATE_RENDERER_SERVICE) private readonly templateRenderer: TemplateRendererServicePort) {}

  async execute(templateKey: string, variables?: Record<string, string>) {
    try {
      return await this.templateRenderer.preview(templateKey, variables);
    } catch {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        `Mail template "${templateKey}" was not found`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
