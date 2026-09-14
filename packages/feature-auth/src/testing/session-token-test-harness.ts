import type { EnvironmentService } from "@repo/api-runtime";

import { JwtService } from "@nestjs/jwt";

import type { FakeAuthSessionRepository } from "./fake-auth-session.repository";

import { SessionTokenService } from "../infrastructure/session-token.service";

/**
 * Real `SessionTokenService` over a fake environment and the in-memory session
 * store. The rotation tests need the real JWT signing and hashing — a stubbed
 * token provider would hide exactly the behaviour under test (that a retry of
 * one rotation can be reproduced byte for byte).
 */
export const TEST_JWT_SECRETS = {
  JWT_ACCESS_SECRET: "test-access-secret-value-0123456789",
  JWT_REFRESH_SECRET: "test-refresh-secret-value-0123456789",
  JWT_ACCESS_TTL: "15m",
  JWT_REFRESH_TTL: "7d",
} as const;

export const createTestEnvironmentService = (
  overrides: Partial<Record<keyof typeof TEST_JWT_SECRETS, string>> = {},
): EnvironmentService =>
  ({ values: { ...TEST_JWT_SECRETS, ...overrides } }) as unknown as EnvironmentService;

export const createTestSessionTokenService = (
  repository: FakeAuthSessionRepository,
  environmentService: EnvironmentService = createTestEnvironmentService(),
): SessionTokenService =>
  new SessionTokenService(environmentService, new JwtService({}), repository.asPort());
