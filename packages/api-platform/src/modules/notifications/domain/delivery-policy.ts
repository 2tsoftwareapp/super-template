/**
 * Max send attempts per notification delivery before it is marked FAILED.
 * Shared by the delivery processor (retry decision) and the deliveries
 * repository (stale-recovery attempt cap) so the two cannot drift apart.
 */
export const MAX_DELIVERY_RETRY_ATTEMPTS = 5;
