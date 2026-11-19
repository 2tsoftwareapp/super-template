import { HttpStatus, Injectable } from "@nestjs/common";
import { AppError } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";

import { TemplateRendererService } from "../../infrastructure/template-renderer.service";

@Injectable()
export class PreviewMailTemplateUseCase {
  constructor(
    private readonly templateRenderer: TemplateRendererService,
  ) {}

  async execute(templateKey: string, variables?: Record<string, string>) {
    // Validate against the known keys before the renderer joins the key into a
    // filesystem path; a traversal segment would otherwise be resolved.
    if (!this.templateRenderer.listTemplateKeys().includes(templateKey)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        `Mail template "${templateKey}" was not found`,
        HttpStatus.BAD_REQUEST,
      );
    }

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
