import { Inject, Injectable } from "@nestjs/common";
import { EnvironmentService } from "@repo/api-runtime";
import {
  MAIL_TEMPLATE_SENDER,
  type MailTemplateSender,
} from "@repo/feature-mail/contracts";

@Injectable()
export class AuthMailService {
  constructor(
    private readonly environmentService: EnvironmentService,
    @Inject(MAIL_TEMPLATE_SENDER)
    private readonly mailSender: MailTemplateSender,
  ) {}

  async sendVerificationEmail(email: string, token: string, displayName?: string) {
    const verifyUrl = `${this.environmentService.values.NEXT_PUBLIC_WEB_URL}/verify-email?token=${token}`;
    await this.mailSender.sendTemplate({
      templateKey: "auth.verify-email",
      to: email,
      variables: {
        displayName: displayName ?? email,
        verifyUrl,
      },
    });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${this.environmentService.values.NEXT_PUBLIC_WEB_URL}/reset-password?token=${token}`;
    await this.mailSender.sendTemplate({
      templateKey: "auth.reset-password",
      to: email,
      variables: {
        displayName: email,
        resetUrl,
      },
    });
  }

  async sendWelcomeEmail(email: string, displayName: string) {
    await this.mailSender.sendTemplate({
      templateKey: "auth.welcome",
      to: email,
      variables: {
        displayName,
        adminUrl: `${this.environmentService.values.ADMIN_ORIGIN}/login`,
      },
    });
  }
}
