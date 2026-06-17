import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

@Injectable()
export class TemplateRendererService {
  private readonly templatesDir = join(__dirname, 'templates');

  async render(
    templateKey: string,
    variables: Record<string, string>,
  ): Promise<{ subject: string; text: string; html: string }> {
    const [subject, text, html] = await Promise.all([
      this.renderFile(`${templateKey}.subject.txt`, variables),
      this.renderFile(`${templateKey}.text.txt`, variables),
      this.renderFile(`${templateKey}.html.txt`, variables),
    ]);

    return { subject, text, html };
  }

  async preview(
    templateKey: string,
    variables: Record<string, string> = {},
  ): Promise<{ subject: string; text: string; html: string }> {
    const defaults: Record<string, string> = {
      displayName: 'Example User',
      verifyUrl: 'https://example.com/verify-email?token=sample',
      resetUrl: 'https://example.com/reset-password?token=sample',
      webUrl: 'https://example.com/login',
      ...variables,
    };

    return this.render(templateKey, defaults);
  }

  private async renderFile(
    fileName: string,
    variables: Record<string, string>,
  ): Promise<string> {
    const filePath = join(this.templatesDir, fileName);
    const template = await readFile(filePath, 'utf8');

    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      return variables[key] ?? '';
    });
  }
}
