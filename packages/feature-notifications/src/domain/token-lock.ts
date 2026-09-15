/**
 * Canonical form of a device token for lock identity.
 *
 * Both sides of the serialization contract — the producer
 * (`DeviceTokensRepository.registerOrTransfer`) and the consumer
 * (`NotificationDeliveryProcessor.processOneDelivery`) — derive their lock id
 * from {@link tokenLockId}, which normalizes through this function first. The
 * lock id is therefore a pure function of the canonical token, never of a call
 * site's raw formatting. Enforced by `domain/__tests__/token-lock.spec.ts`.
 */
export function normalizeDeviceToken(token: string): string {
  return token.trim();
}

/**
 * Derive a stable 32-bit advisory lock ID from a device token string.
 *
 * Shared by the notification delivery processor and the device-token
 * repository: both serialize per-token operations (FCM send vs ownership
 * transfer) against the same lock id. Because both critical sections acquire
 * `pg_try_advisory_lock(tokenLockId(token))`, both MUST call this one function
 * on the token they hold — producer on the request payload it persists,
 * consumer on the row it reads back — so the ids match by construction.
 * Changing the derivation here changes it for every call site at once; the
 * producer/consumer convergence tests in `token-lock.spec.ts` fail if the two
 * sides ever drift.
 */
export function tokenLockId(token: string): number {
  const canonical = normalizeDeviceToken(token);
  let h = 0x811c9dc5;
  for (let i = 0; i < canonical.length; i++) {
    h ^= canonical.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  // pg_try_advisory_lock takes a signed int4; keep positive by masking top bit
  return h & 0x7fffffff;
}
