import { Injectable } from "@nestjs/common";
import { generateOpaqueToken } from "@repo/api-kernel";
import { EnvironmentService } from "@repo/api-runtime";

import type {
  SsoIdentity,
  SsoProviderAdapter,
  SsoTokenSet,
} from "../application/ports/sso-provider.port";

interface IssuedFakeCode {
  subject: string;
  email: string;
  emailVerified: boolean;
  nonce: string;
}

// In-process stand-in for a real OIDC provider so the full start -> callback -> session
// flow can be exercised in dev/E2E without live Google/Apple credentials. Never registered
// when APP_ENV=production (enforced at env-validation time and at module wiring).
@Injectable()
export class FakeSsoAdapter implements SsoProviderAdapter {
  readonly provider = "fake";

  private readonly issuedCodes = new Map<string, IssuedFakeCode>();

  constructor(private readonly environmentService: EnvironmentService) {}

  getCallbackRedirectUri(): string {
    return `${this.environmentService.values.API_INTERNAL_URL}/api/v1/auth/sso/fake/callback`;
  }

  buildAuthorizationUrl(params: {
    state: string;
    nonce: string;
    codeChallenge: string;
    testEmail?: string;
  }): string {
    const code = generateOpaqueToken();
    this.issuedCodes.set(code, {
      subject: `fake-subject-${code.slice(0, 12)}`,
      email: params.testEmail ?? `fake-user-${code.slice(0, 12)}@example.test`,
      emailVerified: true,
      nonce: params.nonce,
    });

    const url = new URL(this.getCallbackRedirectUri());
    url.searchParams.set("code", code);
    url.searchParams.set("state", params.state);
    return url.toString();
  }

  exchangeCode(params: { code: string; codeVerifier: string }): Promise<SsoTokenSet> {
    if (!this.issuedCodes.has(params.code)) {
      throw new Error("Unknown fake authorization code");
    }

    // The fake "id token" is just a handle back to the in-memory record.
    return Promise.resolve({ idToken: params.code });
  }

  verifyIdToken(idToken: string, nonce: string): Promise<SsoIdentity> {
    const issued = this.issuedCodes.get(idToken);

    if (!issued) {
      throw new Error("Unknown fake id token");
    }

    this.issuedCodes.delete(idToken);

    if (issued.nonce !== nonce) {
      throw new Error("Nonce mismatch");
    }

    return Promise.resolve({
      subject: issued.subject,
      email: issued.email,
      emailVerified: issued.emailVerified,
    });
  }
}
