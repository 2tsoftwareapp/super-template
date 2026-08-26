import { Inject, Injectable } from "@nestjs/common";

import { isMandatoryMailTemplate } from "../../constants/mandatory-mail-templates";
import {
  TEMPLATE_RENDERER_SERVICE,
  type TemplateRendererServicePort,
} from "../ports/template-renderer.service.port";

export interface MailTemplateSummary {
  key: string;
  mandatory: boolean;
  sendable: boolean;
  variables: string[];
}

@Injectable()
export class ListMailTemplatesUseCase {
  constructor(
    @Inject(TEMPLATE_RENDERER_SERVICE)
    private readonly templateRenderer: TemplateRendererServicePort,
  ) {}

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
