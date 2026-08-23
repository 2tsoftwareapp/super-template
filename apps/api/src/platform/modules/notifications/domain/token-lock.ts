/**
 * Derive a stable 32-bit advisory lock ID from a device token string.
 *
 * Shared by the notification delivery processor and the device-token
 * repository: both serialize per-token operations (FCM send vs ownership
 * transfer) against the same lock id. Because both critical sections acquire
 * `pg_try_advisory_lock(tokenLockId(token))`, this hash MUST stay identical
 * across call sites — changing it in one place silently breaks serialization.
 */
export function tokenLockId(token: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  // pg_try_advisory_lock takes a signed int4; keep positive by masking top bit
  return h & 0x7fffffff;
}
