import { Injectable } from "@nestjs/common";

import { isMandatoryMailTemplate } from "../../domain/mandatory-mail-templates";
import { TemplateRendererService } from "../../infrastructure/template-renderer.service";

export interface MailTemplateSummary {
  key: string;
  mandatory: boolean;
  sendable: boolean;
  variables: string[];
}

@Injectable()
export class ListMailTemplatesUseCase {
  constructor(private readonly templateRenderer: TemplateRendererService) {}

  async execute(): Promise<MailTemplateSummary[]> {
    const keys = this.templateRenderer.listTemplateKeys();

    return Promise.all(
      keys.map(async (key) => {
        const mandatory = isMandatoryMailTemplate(key);

        return {
          key,
          mandatory,
          sendable: !mandatory,
          variables: await this.templateRenderer.findVariables(key),
        };
      }),
    );
  }
}
