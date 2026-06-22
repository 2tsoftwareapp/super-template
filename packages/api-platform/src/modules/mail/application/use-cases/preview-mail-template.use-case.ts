import { HttpStatus, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import { TemplateRendererService } from '../../infrastructure/template-renderer.service';

@Injectable()
export class PreviewMailTemplateUseCase {
  constructor(private readonly templateRenderer: TemplateRendererService) {}

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
