export interface TemplateRendererServicePort {
  render(
    templateKey: string,
    variables: Record<string, string>,
  ): Promise<{ subject: string; text: string; html: string }>;

  preview(
    templateKey: string,
    variables?: Record<string, string>,
  ): Promise<{
    subject: string;
    text: string;
    html: string;
    missingVariables: string[];
  }>;

  findMissingVariables(
    templateKey: string,
    variables: Record<string, string>,
  ): Promise<string[]>;

  listTemplateKeys(): string[];

  findVariables(templateKey: string): Promise<string[]>;
}

export const TEMPLATE_RENDERER_SERVICE = Symbol('TEMPLATE_RENDERER_SERVICE');
