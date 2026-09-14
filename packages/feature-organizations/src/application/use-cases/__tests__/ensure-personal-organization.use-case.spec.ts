import { ERROR_CODES } from "@repo/api-runtime";
import { describe, expect, it, vi } from "vitest";

import { EnsurePersonalOrganizationUseCase } from "../ensure-personal-organization.use-case";

const USER_ID = "user-1234";
const BASE_SLUG = "alice-user-123";

function buildUseCase(
  options: {
    existingOrganizationId?: string | null;
    takenSlugs?: string[];
    allSlugsTaken?: boolean;
  } = {},
) {
  const taken = new Set(options.takenSlugs ?? []);
  const organizationsRepository = {
    findBySlug: vi.fn(async (slug: string) =>
      options.allSlugsTaken || taken.has(slug) ? { id: `org-${slug}` } : null,
    ),
    createOrganization: vi.fn(async (values: { name: string; slug: string }) => ({
      id: `org-${values.slug}`,
      name: values.name,
      slug: values.slug,
      deletedAt: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    })),
  };
  const membership = {
    findPrimaryOrganizationId: vi.fn(async () => options.existingOrganizationId ?? null),
    addMember: vi.fn(async () => ({})),
  };

  return {
    organizationsRepository,
    membership,
    useCase: new EnsurePersonalOrganizationUseCase(
      organizationsRepository as never,
      membership as never,
    ),
  };
}

describe("EnsurePersonalOrganizationUseCase", () => {
  it("returns the existing primary organization without creating one", async () => {
    const { useCase, organizationsRepository, membership } = buildUseCase({
      existingOrganizationId: "org-existing",
    });

    await expect(useCase.execute(USER_ID, "Alice")).resolves.toBe("org-existing");
    expect(organizationsRepository.createOrganization).not.toHaveBeenCalled();
    expect(organizationsRepository.findBySlug).not.toHaveBeenCalled();
    expect(membership.addMember).not.toHaveBeenCalled();
  });

  it("creates the organization with the base slug when it is free", async () => {
    const { useCase, organizationsRepository, membership } = buildUseCase();

    await expect(useCase.execute(USER_ID, "Alice")).resolves.toBe(`org-${BASE_SLUG}`);

    expect(organizationsRepository.findBySlug).toHaveBeenCalledWith(BASE_SLUG, undefined);
    expect(organizationsRepository.createOrganization).toHaveBeenCalledWith(
      { name: "Alice's Organization", slug: BASE_SLUG },
      undefined,
    );
    expect(membership.addMember).toHaveBeenCalledWith(
      { organizationId: `org-${BASE_SLUG}`, userId: USER_ID, role: "OWNER" },
      undefined,
    );
  });

  it("retries with a random short suffix when the base slug is taken", async () => {
    const { useCase, organizationsRepository } = buildUseCase({ takenSlugs: [BASE_SLUG] });

    await useCase.execute(USER_ID, "Alice");

    const probed = organizationsRepository.findBySlug.mock.calls.map((call) => call[0]);
    const created = organizationsRepository.createOrganization.mock.calls[0]![0];

    // The base slug is probed first, then a suffixed candidate is retried.
    expect(probed[0]).toBe(BASE_SLUG);
    expect(probed).toHaveLength(2);
    expect(created.slug).toMatch(/^alice-user-123-[a-z0-9]{4}$/);
    expect(created.slug).toBe(probed[1]);
  });

  it("fails loudly when every candidate slug is taken", async () => {
    const { useCase, organizationsRepository } = buildUseCase({ allSlugsTaken: true });

    await expect(useCase.execute(USER_ID, "Alice")).rejects.toMatchObject({
      code: ERROR_CODES.INTERNAL_ERROR,
    });
    expect(organizationsRepository.createOrganization).not.toHaveBeenCalled();
    expect(organizationsRepository.findBySlug).toHaveBeenCalledTimes(10);
  });

  it("slugifies the display name and keeps the per-user suffix", async () => {
    const { useCase, organizationsRepository } = buildUseCase();

    await useCase.execute(USER_ID, "  Alice  Ödegård!  ");

    expect(organizationsRepository.createOrganization).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "alice-deg-rd-user-123" }),
      undefined,
    );
  });

  it("fails when the repository returns no organization", async () => {
    const { useCase, organizationsRepository, membership } = buildUseCase();
    organizationsRepository.createOrganization.mockResolvedValueOnce(null as never);

    await expect(useCase.execute(USER_ID, "Alice")).rejects.toMatchObject({
      code: ERROR_CODES.INTERNAL_ERROR,
    });
    expect(membership.addMember).not.toHaveBeenCalled();
  });

  it("passes the transaction executor to probe, create, and membership", async () => {
    const { useCase, organizationsRepository, membership } = buildUseCase();
    const executor = { id: "shared-tx" } as never;

    await useCase.execute(USER_ID, "Alice", executor);

    expect(organizationsRepository.findBySlug).toHaveBeenCalledWith(BASE_SLUG, executor);
    expect(organizationsRepository.createOrganization).toHaveBeenCalledWith(
      expect.anything(),
      executor,
    );
    expect(membership.addMember).toHaveBeenCalledWith(expect.anything(), executor);
  });
});
