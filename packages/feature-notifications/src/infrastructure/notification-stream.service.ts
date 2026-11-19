import type { AppLogger, JsonObject } from "@repo/api-kernel";

import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { APP_LOGGER, isJsonObject } from "@repo/api-kernel";
import { adaptRedisClient, createRedisClient, EnvironmentService } from "@repo/api-runtime";
import { Observable, Subject } from "rxjs";

import type { NotificationStreamServicePort } from "../application/ports/notification-stream.service.port";

export interface NotificationStreamEvent {
  id: string;
  userId: string;
  organizationId: string;
  type: string;
  title: string;
  body: string;
  data: JsonObject | null;
  readAt: string | null;
  createdAt: string;
}

interface RedisStreamClient {
  connect: () => Promise<void>;
  quit: () => Promise<void>;
  publish: (channel: string, message: string) => Promise<number>;
  subscribe: (channel: string, listener: (message: string) => void) => Promise<void>;
  duplicate: () => RedisStreamClient;
  on: (event: "error", listener: (error: Error) => void) => void;
}

@Injectable()
export class NotificationStreamService
  implements OnModuleInit, OnModuleDestroy, NotificationStreamServicePort
{
  private readonly subjects = new Map<string, Subject<NotificationStreamEvent>>();
  private redisPublisher: RedisStreamClient | null = null;
  private redisSubscriber: RedisStreamClient | null = null;
  private redisReady: Promise<void> | null = null;

  constructor(
    private readonly environmentService: EnvironmentService,
    @Inject(APP_LOGGER) private readonly logger: AppLogger,
  ) {}

  onModuleInit(): void {
    // A worker process never opens an SSE stream, so initialising the publisher
    // only from stream() meant its emitted notifications were never published.
    // Fire-and-forget: startup must not block on Redis availability, and
    // `publish()` awaits the same cached promise before sending.
    void this.ensureRedis();
  }

  async onModuleDestroy() {
    await Promise.allSettled([this.redisSubscriber?.quit(), this.redisPublisher?.quit()]);
  }

  emit(userId: string, organizationId: string, event: NotificationStreamEvent): void {
    if (!this.environmentService.values.REDIS_URL) {
      // Single-process mode: no Redis configured, emit locally.
      this.getSubject(this.channelKey(userId, organizationId)).next(event);
      return;
    }

    void this.publish(organizationId, event);
  }

  stream(userId: string, organizationId: string): Observable<NotificationStreamEvent> {
    void this.ensureRedis();
    return this.getSubject(this.channelKey(userId, organizationId)).asObservable();
  }

  /** Channel key that scopes SSE events per user+organization. */
  private channelKey(userId: string, organizationId: string): string {
    return `${organizationId}:${userId}`;
  }

  private getSubject(channelKey: string): Subject<NotificationStreamEvent> {
    const existing = this.subjects.get(channelKey);

    if (existing) {
      return existing;
    }

    const subject = new Subject<NotificationStreamEvent>();
    this.subjects.set(channelKey, subject);
    return subject;
  }

  private async ensureRedis() {
    if (this.redisReady) {
      return this.redisReady;
    }

    const redisUrl = this.environmentService.values.REDIS_URL;

    if (!redisUrl) {
      this.redisReady = Promise.resolve();
      return this.redisReady;
    }

    this.redisReady = (async () => {
      const publisher = adaptRedisClient<RedisStreamClient>(createRedisClient(redisUrl));
      const subscriber = publisher.duplicate();
      const noop = () => void 0;

      publisher.on("error", noop);
      subscriber.on("error", noop);

      await Promise.all([publisher.connect(), subscriber.connect()]);

      await subscriber.subscribe("notifications.stream", (message) => {
        const parsed = this.parseMessage(message);

        if (!parsed) {
          return;
        }

        // Route to the org-scoped channel; only subscribers on the correct org receive the event
        const key = this.channelKey(parsed.userId, parsed.organizationId);
        this.getSubject(key).next(parsed);
      });

      this.redisPublisher = publisher;
      this.redisSubscriber = subscriber;
    })().catch(() => {
      this.redisPublisher = null;
      this.redisSubscriber = null;
    });

    return this.redisReady;
  }

  private async publish(organizationId: string, event: NotificationStreamEvent) {
    await this.ensureRedis();

    if (!this.redisPublisher) {
      /* Redis is configured but unreachable. Delivering locally is better than
       * dropping the event, and keeps `emit` from rejecting into a caller that
       * cannot handle it. */
      this.getSubject(this.channelKey(event.userId, event.organizationId)).next(event);
      return;
    }

    try {
      await this.redisPublisher.publish(
        "notifications.stream",
        JSON.stringify({ ...event, organizationId }),
      );
    } catch (error) {
      this.logger.warn("Failed to publish notification stream event", {
        error: error instanceof Error ? error.message : String(error),
        organizationId,
      });
    }
  }

  private parseMessage(message: string): NotificationStreamEvent | null {
    try {
      const parsed: unknown = JSON.parse(message);

      if (!isJsonObject(parsed)) {
        return null;
      }

      if (
        typeof parsed.id === "string" &&
        typeof parsed.userId === "string" &&
        typeof parsed.organizationId === "string" &&
        typeof parsed.type === "string" &&
        typeof parsed.title === "string" &&
        typeof parsed.body === "string" &&
        (typeof parsed.createdAt === "string" || parsed.createdAt === undefined)
      ) {
        return {
          id: parsed.id,
          userId: parsed.userId,
          organizationId: parsed.organizationId,
          type: parsed.type,
          title: parsed.title,
          body: parsed.body,
          data: isJsonObject(parsed.data) ? parsed.data : null,
          readAt: typeof parsed.readAt === "string" ? parsed.readAt : null,
          createdAt:
            typeof parsed.createdAt === "string" ? parsed.createdAt : new Date().toISOString(),
        };
      }
    } catch {
      return null;
    }

    return null;
  }
}
