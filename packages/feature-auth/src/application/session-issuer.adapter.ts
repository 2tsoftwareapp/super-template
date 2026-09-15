import type { RequestContext } from "@repo/api-kernel";

import { Injectable } from "@nestjs/common";

import {
  SESSION_ISSUER,
  type SessionIssuanceOptions,
  type SessionIssuanceResult,
  type SessionIssuanceUser,
  type SessionIssuer,
} from "../public/session-issuer.port";
import { IssueSessionUseCase } from "./use-cases/issue-session.use-case";

/**
 * Sole SessionIssuer binding: a thin projection of IssueSessionUseCase (the
 * shared tail of login and post-MFA flows) onto the port. The return-type
 * annotation is the compile-time parity check — if the login-response shape
 * drifts from SessionIssuanceResult, this file fails to typecheck.
 */
@Injectable()
export class SessionIssuerAdapter implements SessionIssuer {
  constructor(private readonly issueSessionUseCase: IssueSessionUseCase) {}

  async issue(
    user: SessionIssuanceUser,
    requestContext?: RequestContext,
    options?: SessionIssuanceOptions,
  ): Promise<SessionIssuanceResult> {
    return this.issueSessionUseCase.execute(user, requestContext, options);
  }
}

export { SESSION_ISSUER };
