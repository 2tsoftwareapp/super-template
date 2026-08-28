import {
  type DynamicModule,
  type ForwardReference,
  Module,
  type Provider,
  type Type,
} from "@nestjs/common";

import { OutboxDispatcher } from "./application/outbox-dispatcher.service";
import { OutboxHandlerRegistry } from "./application/outbox-handler.registry";
import { OutboxRepository } from "./infrastructure/outbox.repository";
import { OUTBOX_APPENDER } from "./public/outbox-appender.port";
import {
  OUTBOX_HANDLER_REGISTRY,
  type OutboxHandlerRegistryPort,
  type OutboxTopicHandler,
  type OutboxTopicHandlerClass,
  type OutboxTopicHandlerContribution,
} from "./public/outbox-handler.port";
import { OUTBOX_REPOSITORY } from "./public/outbox.port";

/**
 * Single handler slot passed to {@link OutboxModule.register}. The handler
 * class is listed as a provider in the feature's own Nest module, and the
 * outbox module injects the already-instantiated instance through
 * `handlerClass` used as a Nest injection token.
 */
export interface OutboxHandlerSlot {
  readonly handlerClass: OutboxTopicHandlerClass;
}

/**
 * Options accepted by {@link OutboxModule.register}. The composition layer
 * collects handler slots from every feature manifest and passes the merged
 * list here, so registration is fully driven by the manifest graph.
 */
export interface OutboxModuleOptions {
  /** Modules that provide the handler classes listed in `handlers`. */
  readonly imports?: readonly (Type<unknown> | ForwardReference)[];
  readonly handlers: readonly OutboxHandlerSlot[];
}

/**
 * Validate handler class shape. Throws synchronously at composition time so
 * a misconfigured handler fails before the application starts — never at the
 * first cron tick.
 */
function assertUniqueAndTyped(handlers: readonly OutboxHandlerSlot[]): void {
  const seen = new Map<string, string>();
  for (const { handlerClass } of handlers) {
    if (typeof handlerClass !== "function") {
      throw new Error(
        `OutboxModule.register: handler entry is not a class constructor (${String(handlerClass)}).`,
      );
    }
    const topic = handlerClass.topic;
    if (typeof topic !== "string" || topic.length === 0) {
      throw new Error(
        `OutboxModule.register: handler class "${handlerClass.name}" is missing a static "topic" string.`,
      );
    }
    const prior = seen.get(topic);
    if (prior !== undefined) {
      throw new Error(
        `OutboxModule.register: duplicate topic "${topic}" registered by both "${prior}" and "${handlerClass.name}".`,
      );
    }
    seen.set(topic, handlerClass.name);
  }
}

/**
 * Generic transactional outbox: producers append events in their own
 * transaction; the feature-contributed handlers registered via
 * {@link OutboxModule.register} receive them from the dispatcher cron.
 *
 * The module is intentionally NOT @Global(): the API host must explicitly
 * import `OutboxModule.register({ handlers, imports })` so handler wiring
 * is visible in the composition layer.
 */
@Module({})
export class OutboxModule {
  static register(options: OutboxModuleOptions): DynamicModule {
    assertUniqueAndTyped(options.handlers);

    const bridgeProvider: Provider = {
      provide: OUTBOX_HANDLER_REGISTRY,
      useFactory: (...instances: unknown[]): OutboxHandlerRegistryPort => {
        const built: OutboxTopicHandlerContribution[] = instances.map((instance, index) => {
          const slot = options.handlers[index];
          if (!slot) {
            throw new Error(
              `OutboxModule.register: missing handler slot for instance index ${index}.`,
            );
          }
          const topicRaw = (instance as { topic?: unknown }).topic ?? slot.handlerClass.topic;
          const topic = typeof topicRaw === "string" ? topicRaw : slot.handlerClass.topic;
          const handle = (instance as OutboxTopicHandler).handle.bind(instance);
          return { topic, handle };
        });
        return new OutboxHandlerRegistry(built);
      },
      inject: options.handlers.map((slot) => slot.handlerClass as Type<unknown>),
    };

    const dynamicImports: (Type<unknown> | ForwardReference)[] = options.imports
      ? [...options.imports]
      : [];

    return {
      module: OutboxModule,
      global: true,
      imports: dynamicImports,
      providers: [
        OutboxRepository,
        OutboxDispatcher,
        bridgeProvider,
        {
          provide: OUTBOX_REPOSITORY,
          useExisting: OutboxRepository,
        },
        {
          provide: OUTBOX_APPENDER,
          useExisting: OutboxRepository,
        },
      ],
      exports: [OUTBOX_REPOSITORY, OUTBOX_APPENDER, OUTBOX_HANDLER_REGISTRY],
    };
  }
}
