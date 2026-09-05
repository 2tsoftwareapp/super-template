import { createClient, type RedisClientType } from "redis";

export function createRedisClient(url: string): RedisClientType {
  return createClient({
    url,
    socket: {
      // Fail readiness/cache quickly when Redis is unreachable (default can hang).
      connectTimeout: 2_000,
    },
  });
}

export function adaptRedisClient<TTarget>(client: RedisClientType): TTarget {
  return client as unknown as TTarget;
}
