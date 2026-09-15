import type { RequestContext } from "@repo/api-kernel";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, hashOpaqueToken, SYSTEM_SCOPE } from "@repo/api-kernel";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";
import { MFA_ERROR_CODES } from "@repo/feature-mfa/contracts";

import type { MfaVerifyChallengeCommand } from "../mfa.types";

import { MFA_REPOSITORY, type MfaRepositoryPort } from "../ports/mfa.repository.port";
import { MfaCodeVerifierService } from "../services/mfa-code-verifier.service";

const MAX_CHALLENGE_ATTEMPTS = 5;

@Injectable()
export class VerifyMfaChallengeUseCase {
  constructor(
    @Inject(MFA_REPOSITORY) private readonly mfaRepository: MfaRepositoryPort,
    private readonly mfaCodeVerifierService: MfaCodeVerifierService,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    input: MfaVerifyChallengeCommand,
    requestContext?: RequestContext,
  ): Promise<{ userId: string }> {
    const challenge = await this.mfaRepository.findValidChallengeByTokenHash(
      hashOpaqueToken(input.mfaToken),
    );

    if (!challenge) {
      throw new AppError(
        MFA_ERROR_CODES.MFA_CHALLENGE_INVALID,
        "Challenge is invalid or expired",
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Cheap pre-filter only: avoids spending a TOTP verification on an
    // exhausted challenge. It is NOT the threshold gate — see the atomic
    // increment below, which is the one that cannot be raced.
    if (challenge.attempts >= MAX_CHALLENGE_ATTEMPTS) {
      throw new AppError(
        MFA_ERROR_CODES.MFA_TOO_MANY_ATTEMPTS,
        "Too many failed attempts, request a new login",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const codeIsValid = await this.mfaCodeVerifierService.verifyCode(challenge.userId, input.code);

    if (!codeIsValid) {
      // Atomically check the threshold and count the attempt in one statement
      // (`attempts = attempts + 1 WHERE attempts < max`). Two concurrent wrong
      // codes therefore cannot both pass a stale read and push the counter past
      // the limit; the loser gets null and is throttled without being counted.
      const counted = await this.mfaRepository.tryIncrementChallengeAttempts(
        challenge.id,
        MAX_CHALLENGE_ATTEMPTS,
      );

      if (!counted) {
        // The counter is already at the limit — the same outcome the
        // pre-filter produces, and for the same reason: no attempt was
        // recorded, so no `mfa.challenge.failed` audit row either.
        throw new AppError(
          MFA_ERROR_CODES.MFA_TOO_MANY_ATTEMPTS,
          "Too many failed attempts, request a new login",
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      await this.auditWriter.log({
        actorId: challenge.userId,
        action: "mfa.challenge.failed",
        entityType: "user",
        entityId: challenge.userId,
        requestContext,
        scope: SYSTEM_SCOPE.PLATFORM,
      });

      throw new AppError(
        MFA_ERROR_CODES.MFA_INVALID_CODE,
        "Invalid verification code",
        HttpStatus.UNAUTHORIZED,
      );
    }

    // CAS-consume the one-time challenge BEFORE granting access. A false
    // result means a concurrent request already consumed it — this request
    // loses the race and must not authenticate (TOCTOU guard).
    const consumed = await this.mfaRepository.consumeChallenge(challenge.id);

    if (!consumed) {
      throw new AppError(
        MFA_ERROR_CODES.MFA_CHALLENGE_INVALID,
        "Challenge was already used",
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.auditWriter.log({
      actorId: challenge.userId,
      action: "mfa.challenge.succeeded",
      entityType: "user",
      entityId: challenge.userId,
      requestContext,
      scope: SYSTEM_SCOPE.PLATFORM,
    });

    return { userId: challenge.userId };
  }
}
