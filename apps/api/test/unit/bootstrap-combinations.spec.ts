import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";

import { DATABASE } from "@repo/database-runtime";
import { ORGANIZATION_MEMBERSHIP } from "@repo/feature-users/contracts";
import { USER_ROLE_ASSIGNMENTS } from "@repo/feature-users/contracts";
import { UsersModule } from "@repo/feature-users/module";
import { UsersRepository } from "@repo/feature-users/module";

const databaseStub = {};
const membershipStub = { findUserIdsForOrganization: async () => [] };
const assignmentsStub = { findUserIdsForRoleName: async () => [] };

describe("deterministic Nest feature bootstrap matrix", () => {
  it.each([
    ["users-only", false, false],
    ["users-with-organization-contract", true, false],
    ["users-with-access-control-contract", false, true],
    ["users-with-both-contracts", true, true],
  ])("boots %s without external infrastructure", async (_name, withMembership, withAccessControl) => {
    const builder = Test.createTestingModule({
      imports: [UsersModule],
      providers: [
        { provide: DATABASE, useValue: databaseStub },
        ...(withMembership ? [{ provide: ORGANIZATION_MEMBERSHIP, useValue: membershipStub }] : []),
        ...(withAccessControl ? [{ provide: USER_ROLE_ASSIGNMENTS, useValue: assignmentsStub }] : []),
      ],
    }).overrideProvider(UsersRepository).useValue({});

    const moduleRef = await builder.compile();
    expect(moduleRef.get(DATABASE)).toBe(databaseStub);
    await moduleRef.close();
  });
});
