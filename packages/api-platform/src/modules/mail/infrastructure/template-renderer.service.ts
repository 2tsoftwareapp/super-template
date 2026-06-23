import { Injectable } from '@nestjs/common';
import { existsSync, readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

function resolveTemplatesDir(): string {
  const marker = 'auth.verify-email.subject.txt';
  const candidates = [
    join(__dirname, 'templates'),
    join(__dirname, 'infrastructure', 'templates'),
    join(process.cwd(), 'dist', 'templates'),
    join(
      process.cwd(),
      '../../packages/api-platform/src/modules/mail/infrastructure/templates',
    ),
    join(
      process.cwd(),
      'packages/api-platform/src/modules/mail/infrastructure/templates',
    ),
  ];

  for (const dir of candidates) {
    if (existsSync(join(dir, marker))) {
      return dir;
    }
  }

  return join(__dirname, 'templates');
}

const PREVIEW_DEFAULT_VARIABLES: Record<string, string> = {
  displayName: 'Example User',
  verifyUrl: 'https://example.com/verify-email?token=sample',
  resetUrl: 'https://example.com/reset-password?token=sample',
  webUrl: 'https://example.com/login',
};

@Injectable()
export class TemplateRendererService {
  private readonly templatesDir = resolveTemplatesDir();

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
  ): Promise<{
    subject: string;
    text: string;
    html: string;
    missingVariables: string[];
  }> {
    const defaults: Record<string, string> = {
      ...PREVIEW_DEFAULT_VARIABLES,
      ...variables,
    };

    const [rendered, missingVariables] = await Promise.all([
      this.render(templateKey, defaults),
      this.findMissingVariables(templateKey, defaults),
    ]);

    return { ...rendered, missingVariables };
  }

  /** Variables referenced by the template that have no supplied or default value. */
  async findMissingVariables(
    templateKey: string,
    variables: Record<string, string>,
  ): Promise<string[]> {
    const allVariables = await this.findVariables(templateKey);
    return allVariables.filter((name) => !(name in variables));
  }

  listTemplateKeys(): string[] {
    const suffix = '.subject.txt';
    return readdirSync(this.templatesDir)
      .filter((file) => file.endsWith(suffix))
      .map((file) => file.slice(0, -suffix.length))
      .sort();
  }

  async findVariables(templateKey: string): Promise<string[]> {
    const contents = await Promise.all(
      ['subject', 'text', 'html'].map((part) =>
        readFile(join(this.templatesDir, `${templateKey}.${part}.txt`), 'utf8'),
      ),
    );

    const variables = new Set<string>();
    for (const content of contents) {
      for (const match of content.matchAll(/\{\{(\w+)\}\}/g)) {
        variables.add(match[1]!);
      }
    }

    return [...variables].sort();
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
