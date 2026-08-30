import { describe, expect, it, vi } from "vitest";

import { RegisterUseCase } from "../register.use-case";

function buildMocks() {
  const tx = { __tx: true };

  const transactionPort = {
    run: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(tx)),
  };

  const usersRepository = {
    findByEmail: vi.fn(async () => null),
    create: vi.fn(
      async (input: {
        email: string;
        passwordHash: string;
        displayName: string;
        status: string;
      }) => ({
        id: "new-user-id",
        email: input.email,
        displayName: input.displayName,
        status: input.status,
      }),
    ),
  };

  const accessControlService = {
    getRoleByName: vi.fn(async () => ({ id: "role-user", name: "USER" })),
    replaceUserRoles: vi.fn(async () => {}),
  };

  const auditWriter = {
    log: vi.fn(async () => {}),
  };

  const authSessionRepository = {
    storeEmailVerificationToken: vi.fn(async () => ({ id: "token-id" })),
  };

  const outbox = {
    append: vi.fn(async () => {}),
  };

  const applicationSettingsLookup = {
    isRegistrationEnabled: vi.fn(async () => true),
    isMaintenanceMode: vi.fn(async () => false),
  };

  const personalOrganizationProvisioner = {
    ensurePersonalOrganization: vi.fn(async () => {}),
  };

  const useCase = new RegisterUseCase(
    transactionPort as never,
    usersRepository as never,
    accessControlService as never,
    auditWriter as never,
    authSessionRepository as never,
    outbox as never,
    applicationSettingsLookup as never,
    personalOrganizationProvisioner as never,
  );

  return {
    useCase,
    tx,
    transactionPort,
    usersRepository,
    accessControlService,
    auditWriter,
    authSessionRepository,
    outbox,
    applicationSettingsLookup,
    personalOrganizationProvisioner,
  };
}

describe("RegisterUseCase", () => {
  it("rejects registration when the registration_enabled setting is off", async () => {
    const m = buildMocks();
    m.applicationSettingsLookup.isRegistrationEnabled.mockResolvedValue(false);

    await expect(
      m.useCase.execute({
        email: "new@test.com",
        password: "strong-password-123",
        displayName: "New User",
      }),
    ).rejects.toMatchObject({ code: "REGISTRATION_DISABLED" });

    expect(m.usersRepository.findByEmail).not.toHaveBeenCalled();
    expect(m.usersRepository.create).not.toHaveBeenCalled();
  });

  it("rejects when email already exists", async () => {
    const m = buildMocks();
    m.usersRepository.findByEmail.mockResolvedValue({
      id: "existing-user",
      email: "taken@test.com",
    });

    await expect(
      m.useCase.execute({
        email: "taken@test.com",
        password: "strong-password-123",
        displayName: "Duplicate",
      }),
    ).rejects.toMatchObject({ code: "USER_EMAIL_ALREADY_EXISTS" });

    expect(m.usersRepository.create).not.toHaveBeenCalled();
  });

  it("successfully registers a new user with all side effects in one transaction", async () => {
    const m = buildMocks();

    const result = await m.useCase.execute({
      email: "new@test.com",
      password: "strong-password-123",
      displayName: "New User",
    });

    // --- Returns success ---
    expect(result).toEqual({
      success: true,
      message: "Registration successful. Verify your email to continue.",
    });

    // --- Transaction: single run call ---
    expect(m.transactionPort.run).toHaveBeenCalledTimes(1);

    // --- User created with PENDING status ---
    expect(m.usersRepository.findByEmail).toHaveBeenCalledWith("new@test.com");
    expect(m.usersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new@test.com",
        displayName: "New User",
        status: "PENDING",
      }),
      m.tx,
    );
    expect(m.usersRepository.create.mock.calls[0][0].passwordHash).toBeTruthy();
    expect(m.usersRepository.create.mock.calls[0][0].passwordHash).not.toBe("strong-password-123");

    // --- USER role assigned ---
    expect(m.accessControlService.getRoleByName).toHaveBeenCalledWith("USER", null, m.tx);
    expect(m.accessControlService.replaceUserRoles).toHaveBeenCalledWith(
      "new-user-id",
      ["role-user"],
      null,
      m.tx,
    );

    // --- Personal organization provisioned with RBAC ---
    expect(m.personalOrganizationProvisioner.ensurePersonalOrganization).toHaveBeenCalledWith(
      "new-user-id",
      "New User",
      m.tx,
    );

    // --- Verification token stored ---
    expect(m.authSessionRepository.storeEmailVerificationToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "new-user-id",
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
      m.tx,
    );
    // Token hash must differ from the plaintext token sent via outbox.
    const storedTokenHash =
      m.authSessionRepository.storeEmailVerificationToken.mock.calls[0][0].tokenHash;
    expect(storedTokenHash).toBeTruthy();

    // --- Email outbox appended ---
    expect(m.outbox.append).toHaveBeenCalledWith(
      "auth.send-verification-email",
      expect.objectContaining({
        email: "new@test.com",
        token: expect.any(String),
      }),
      m.tx,
    );
    // The outbox token must match the stored hash (same opaque token).
    const outboxToken = m.outbox.append.mock.calls[0][1].token;
    expect(outboxToken).toBeTruthy();

    // --- Audit written ---
    expect(m.auditWriter.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "new-user-id",
        action: "auth.registered",
        entityType: "user",
        entityId: "new-user-id",
        scope: expect.any(String),
      }),
      m.tx,
    );

    // --- All side effects share the SAME transaction executor ---
    const allTxArgs = [
      m.usersRepository.create.mock.calls[0]?.[1],
      m.accessControlService.replaceUserRoles.mock.calls[0]?.[3],
      m.personalOrganizationProvisioner.ensurePersonalOrganization.mock.calls[0]?.[2],
      m.authSessionRepository.storeEmailVerificationToken.mock.calls[0]?.[1],
      m.outbox.append.mock.calls[0]?.[2],
      m.auditWriter.log.mock.calls[0]?.[1],
    ].filter(Boolean);
    const uniqueTxs = new Set(allTxArgs);
    expect(uniqueTxs.size).toBe(1);
  });

  it("checks email against case-insensitive normalized form", async () => {
    const m = buildMocks();
    m.usersRepository.findByEmail.mockResolvedValue(null);

    await m.useCase.execute({
      email: "  NEW@TEST.COM  ",
      password: "strong-password-123",
      displayName: "New User",
    });

    // Email should be normalized before lookup
    expect(m.usersRepository.findByEmail).toHaveBeenCalledWith("new@test.com");
  });
});
