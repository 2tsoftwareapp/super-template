import type { RequestContext } from "@repo/api-core";

import { Injectable } from "@nestjs/common";

import type { MfaChallengeMetadata } from "./mfa.types";

import { CreateMfaChallengeUseCase } from "./use-cases/create-mfa-challenge.use-case";
import { GetMfaStatusUseCase } from "./use-cases/get-mfa-status.use-case";
import { VerifyMfaChallengeUseCase } from "./use-cases/verify-mfa-challenge.use-case";

/**
 * Cross-module facade exposing the MFA operations the auth login flow needs
 * (challenge creation/verification and the enabled check). Self-service MFA
 * endpoints inject the MFA use cases directly instead of this facade.
 */
@Injectable()
export class MfaService {
  constructor(
    private readonly getMfaStatusUseCase: GetMfaStatusUseCase,
    private readonly createMfaChallengeUseCase: CreateMfaChallengeUseCase,
    private readonly verifyMfaChallengeUseCase: VerifyMfaChallengeUseCase,
  ) {}

  async isEnabled(userId: string): Promise<boolean> {
    const status = await this.getMfaStatusUseCase.execute(userId);
    return status.enabled;
  }

  createLoginChallenge(userId: string, metadata: MfaChallengeMetadata) {
    return this.createMfaChallengeUseCase.execute({ userId, metadata });
  }

  verifyLoginChallenge(
    mfaToken: string,
    code: string,
    metadata: MfaChallengeMetadata,
    requestContext?: RequestContext,
  ) {
    return this.verifyMfaChallengeUseCase.execute({ mfaToken, code, metadata }, requestContext);
  }
}
