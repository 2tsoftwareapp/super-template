import { createClient, type RedisClientType } from 'redis';

export function createRedisClient(url: string): RedisClientType {
  return createClient({ url });
}

export function adaptRedisClient<TTarget>(
  client: RedisClientType,
): TTarget {
  return client as unknown as TTarget;
}
