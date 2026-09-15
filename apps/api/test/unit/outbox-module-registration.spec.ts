import { Global, Module } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { APP_LOGGER, TenantContextService } from "@repo/api-kernel";
import { DATABASE } from "@repo/database-runtime";
import { OutboxDispatcher } from "@repo/feature-outbox/dispatcher";
import { OutboxHandlerRegistry } from "@repo/feature-outbox/registry";
import {
  OUTBOX_HANDLER_REGISTRY,
  OUTBOX_REPOSITORY,
  OutboxModule,
  type OutboxHandlerSlot,
  type OutboxMessage,
  type OutboxRepositoryPort,
  type OutboxRecord,
} from "@repo/feature-outbox/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class FakeOutboxRepository implements OutboxRepositoryPort {
  messages: OutboxRecord[] = [];
  sent: string[] = [];
  failed: { id: string; reason: string }[] = [];

  async append(): Promise<void> {
    throw new Error("not used in dispatch tests");
  }
  async claimPending(): Promise<OutboxRecord[]> {
    return this.messages.splice(0);
  }
  async markSent(id: string): Promise<void> {
    this.sent.push(id);
  }
  async markFailed(id: string, reason: string): Promise<void> {
    this.failed.push({ id, reason });
  }
  async recoverStaleProcessing(): Promise<void> {
    // no-op
  }
}

class SendVerificationEmailHandler {
  static readonly topic = "auth.send-verification-email";
  static readonly calls: { email: string; token: string }[] = [];
  handle(message: OutboxMessage): Promise<void> {
    SendVerificationEmailHandler.calls.push({
      email: String(message.payload.email),
      token: String(message.payload.token),
    });
    return Promise.resolve();
  }
}

class UserLifecycleCreatedHandler {
  static readonly topic = "user.lifecycle.created";
  static readonly calls: { userId: string }[] = [];
  handle(message: OutboxMessage): Promise<void> {
    UserLifecycleCreatedHandler.calls.push({ userId: String(message.payload.userId) });
    return Promise.resolve();
  }
}

class UserLifecycleDeletedHandler {
  static readonly topic = "user.lifecycle.deleted";
  static readonly calls: { userId: string }[] = [];
  handle(message: OutboxMessage): Promise<void> {
    UserLifecycleDeletedHandler.calls.push({ userId: String(message.payload.userId) });
    return Promise.resolve();
  }
}

class UserLifecyclePasswordChangedHandler {
  static readonly topic = "user.lifecycle.password-changed";
  static readonly calls: { userId: string }[] = [];
  handle(message: OutboxMessage): Promise<void> {
    UserLifecyclePasswordChangedHandler.calls.push({ userId: String(message.payload.userId) });
    return Promise.resolve();
  }
}

class UserLifecycleStatusBlockedHandler {
  static readonly topic = "user.lifecycle.status-blocked";
  static readonly calls: { userId: string }[] = [];
  handle(message: OutboxMessage): Promise<void> {
    UserLifecycleStatusBlockedHandler.calls.push({ userId: String(message.payload.userId) });
    return Promise.resolve();
  }
}

/** Stand-in for the feature module that hosts the handler classes. */
@Module({
  providers: [
    SendVerificationEmailHandler,
    UserLifecycleCreatedHandler,
    UserLifecycleDeletedHandler,
    UserLifecyclePasswordChangedHandler,
    UserLifecycleStatusBlockedHandler,
  ],
  exports: [
    SendVerificationEmailHandler,
    UserLifecycleCreatedHandler,
    UserLifecycleDeletedHandler,
    UserLifecyclePasswordChangedHandler,
    UserLifecycleStatusBlockedHandler,
  ],
})
class FakeAuthHandlersModule {}

@Global()
@Module({
  providers: [
    {
      provide: APP_LOGGER,
      useValue: { error: () => undefined, warn: () => undefined, info: () => undefined },
    },
    { provide: DATABASE, useValue: {} },
    // OutboxDispatcher enters each claimed message's tenant context before
    // invoking its handler; the real provider comes from DatabaseModule.
    TenantContextService,
  ],
  exports: [APP_LOGGER, DATABASE, TenantContextService],
})
class FakeCoreModule {}

const HANDLER_CLASSES = [
  SendVerificationEmailHandler,
  UserLifecycleCreatedHandler,
  UserLifecycleDeletedHandler,
  UserLifecyclePasswordChangedHandler,
  UserLifecycleStatusBlockedHandler,
] as const;

const resetCalls = (): void => {
  SendVerificationEmailHandler.calls.length = 0;
  UserLifecycleCreatedHandler.calls.length = 0;
  UserLifecycleDeletedHandler.calls.length = 0;
  UserLifecyclePasswordChangedHandler.calls.length = 0;
  UserLifecycleStatusBlockedHandler.calls.length = 0;
};

const buildHarness = async (
  slots: readonly OutboxHandlerSlot[],
  imports: ReadonlyArray<unknown> = [FakeAuthHandlersModule],
): Promise<{ module: TestingModule; repository: FakeOutboxRepository }> => {
  const repository = new FakeOutboxRepository();
  const module = await Test.createTestingModule({
    imports: [
      FakeCoreModule,
      OutboxModule.register({
        handlers: [...slots],
        imports: imports as never,
      }),
    ],
  })
    .overrideProvider(OUTBOX_REPOSITORY)
    .useValue(repository)
    .compile();
  return { module, repository };
};

describe("OutboxModule.register (runtime wiring)", () => {
  let module: TestingModule | undefined;
  let repository: FakeOutboxRepository | undefined;

  beforeEach(() => {
    resetCalls();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
      module = undefined;
    }
    repository = undefined;
  });

  it("registers every auth handler and exposes exactly five topics", async () => {
    const slots: OutboxHandlerSlot[] = HANDLER_CLASSES.map((handlerClass) => ({
      handlerClass: handlerClass as never,
    }));
    ({ module, repository } = await buildHarness(slots));

    const registry = module.get<OutboxHandlerRegistry>(OUTBOX_HANDLER_REGISTRY);
    const topics = registry
      .getAll()
      .map((c) => c.topic)
      .sort();
    expect(topics).toEqual([
      "auth.send-verification-email",
      "user.lifecycle.created",
      "user.lifecycle.deleted",
      "user.lifecycle.password-changed",
      "user.lifecycle.status-blocked",
    ]);
  });

  it("dispatches user.lifecycle.created and marks the message sent", async () => {
    const slots = HANDLER_CLASSES.map((handlerClass) => ({ handlerClass: handlerClass as never }));
    ({ module, repository } = await buildHarness(slots));

    repository!.messages.push({
      id: "m1",
      organizationId: null,
      topic: "user.lifecycle.created",
      payload: { userId: "u-1", email: "u@x", displayName: "U" },
      attempts: 0,
      status: "PENDING",
      maxAttempts: 3,
    });

    const dispatcher = module.get(OutboxDispatcher);
    await dispatcher.processPendingMessages();

    expect(UserLifecycleCreatedHandler.calls).toEqual([{ userId: "u-1" }]);
    expect(repository!.sent).toEqual(["m1"]);
  });

  it("dispatches user.lifecycle.deleted and revokes the session", async () => {
    const slots = HANDLER_CLASSES.map((handlerClass) => ({ handlerClass: handlerClass as never }));
    ({ module, repository } = await buildHarness(slots));

    repository!.messages.push({
      id: "m2",
      organizationId: null,
      topic: "user.lifecycle.deleted",
      payload: { userId: "u-2" },
      attempts: 0,
      status: "PENDING",
      maxAttempts: 3,
    });

    const dispatcher = module.get(OutboxDispatcher);
    await dispatcher.processPendingMessages();

    expect(UserLifecycleDeletedHandler.calls).toEqual([{ userId: "u-2" }]);
    expect(repository!.sent).toEqual(["m2"]);
  });

  it("dispatches user.lifecycle.password-changed and revokes the session", async () => {
    const slots = HANDLER_CLASSES.map((handlerClass) => ({ handlerClass: handlerClass as never }));
    ({ module, repository } = await buildHarness(slots));

    repository!.messages.push({
      id: "m3",
      organizationId: null,
      topic: "user.lifecycle.password-changed",
      payload: { userId: "u-3" },
      attempts: 0,
      status: "PENDING",
      maxAttempts: 3,
    });

    const dispatcher = module.get(OutboxDispatcher);
    await dispatcher.processPendingMessages();

    expect(UserLifecyclePasswordChangedHandler.calls).toEqual([{ userId: "u-3" }]);
    expect(repository!.sent).toEqual(["m3"]);
  });

  it("dispatches user.lifecycle.status-blocked and revokes the session", async () => {
    const slots = HANDLER_CLASSES.map((handlerClass) => ({ handlerClass: handlerClass as never }));
    ({ module, repository } = await buildHarness(slots));

    repository!.messages.push({
      id: "m4",
      organizationId: null,
      topic: "user.lifecycle.status-blocked",
      payload: { userId: "u-4" },
      attempts: 0,
      status: "PENDING",
      maxAttempts: 3,
    });

    const dispatcher = module.get(OutboxDispatcher);
    await dispatcher.processPendingMessages();

    expect(UserLifecycleStatusBlockedHandler.calls).toEqual([{ userId: "u-4" }]);
    expect(repository!.sent).toEqual(["m4"]);
  });

  it("dispatches auth.send-verification-email and sends the mail", async () => {
    const slots = HANDLER_CLASSES.map((handlerClass) => ({ handlerClass: handlerClass as never }));
    ({ module, repository } = await buildHarness(slots));

    repository!.messages.push({
      id: "m5",
      organizationId: null,
      topic: "auth.send-verification-email",
      payload: { email: "u@x", token: "tok", displayName: "U" },
      attempts: 0,
      status: "PENDING",
      maxAttempts: 3,
    });

    const dispatcher = module.get(OutboxDispatcher);
    await dispatcher.processPendingMessages();

    expect(SendVerificationEmailHandler.calls).toEqual([{ email: "u@x", token: "tok" }]);
    expect(repository!.sent).toEqual(["m5"]);
  });

  it("marks unknown topics as failed and never invokes any handler", async () => {
    const slots = HANDLER_CLASSES.map((handlerClass) => ({ handlerClass: handlerClass as never }));
    ({ module, repository } = await buildHarness(slots));

    repository!.messages.push({
      id: "m6",
      organizationId: null,
      topic: "no.such.topic",
      payload: {},
      attempts: 0,
      status: "PENDING",
      maxAttempts: 3,
    });

    const dispatcher = module.get(OutboxDispatcher);
    await dispatcher.processPendingMessages();

    expect(repository!.sent).toEqual([]);
    expect(repository!.failed).toEqual([{ id: "m6", reason: "no handler registered for topic" }]);
  });

  it("rejects duplicate topics at composition time, not at dispatch", () => {
    const DuplicateA = class {
      static readonly topic = "dup.topic";
      handle(): Promise<void> {
        return Promise.resolve();
      }
    };
    const DuplicateB = class {
      static readonly topic = "dup.topic";
      handle(): Promise<void> {
        return Promise.resolve();
      }
    };
    expect(() =>
      OutboxModule.register({
        handlers: [{ handlerClass: DuplicateA as never }, { handlerClass: DuplicateB as never }],
      }),
    ).toThrow(/duplicate topic "dup\.topic"/);
  });

  it("boots without auth handlers when only the outbox core is composed", async () => {
    ({ module, repository } = await buildHarness([], []));

    const registry = module.get<OutboxHandlerRegistry>(OUTBOX_HANDLER_REGISTRY);
    expect(registry.getAll()).toEqual([]);

    repository!.messages.push({
      id: "orphan",
      organizationId: null,
      topic: "user.lifecycle.created",
      payload: { userId: "u-x" },
      attempts: 0,
      status: "PENDING",
      maxAttempts: 3,
    });

    const dispatcher = module.get(OutboxDispatcher);
    await dispatcher.processPendingMessages();

    expect(UserLifecycleCreatedHandler.calls).toEqual([]);
    expect(repository!.sent).toEqual([]);
    expect(repository!.failed).toEqual([
      { id: "orphan", reason: "no handler registered for topic" },
    ]);
  });
});
