import { Inject, Injectable, Optional } from "@nestjs/common";
import { MAIL_TEMPLATE_SENDER, type MailTemplateSender } from "@repo/api-kernel";
import { EnvironmentService } from "@repo/api-runtime";

/**
 * Sends auth emails through the kernel-owned MAIL_TEMPLATE_SENDER port. The
 * port is optional so a composition without feature-mail still boots;
 * sending throws a clear configuration error instead of failing DI.
 */
@Injectable()
export class AuthMailService {
  constructor(
    private readonly environmentService: EnvironmentService,
    @Optional()
    @Inject(MAIL_TEMPLATE_SENDER)
    private readonly mailSender: MailTemplateSender | undefined,
  ) {}

  private requireMailSender(): MailTemplateSender {
    if (!this.mailSender) {
      throw new Error(
        "MAIL_TEMPLATE_SENDER is not bound: compose @repo/feature-mail (or bind the kernel mail port) to send auth emails.",
      );
    }
    return this.mailSender;
  }

  async sendVerificationEmail(email: string, token: string, displayName?: string) {
    const verifyUrl = `${this.environmentService.values.NEXT_PUBLIC_WEB_URL}/verify-email?token=${token}`;
    await this.requireMailSender().sendTemplate({
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
    await this.requireMailSender().sendTemplate({
      templateKey: "auth.reset-password",
      to: email,
      variables: {
        displayName: email,
        resetUrl,
      },
    });
  }

  async sendWelcomeEmail(email: string, displayName: string) {
    await this.requireMailSender().sendTemplate({
      templateKey: "auth.welcome",
      to: email,
      variables: {
        displayName,
        adminUrl: `${this.environmentService.values.ADMIN_ORIGIN}/login`,
      },
    });
  }
}
