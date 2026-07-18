export const ADVISORY_LOCK_PORT = Symbol('ADVISORY_LOCK_PORT');

export interface AdvisoryLockPort {
  /**
   * Attempts to acquire a PostgreSQL advisory lock (session-level).
   * If acquired, executes the provided function within the exact same database connection
   * (pool client) that holds the lock, then guarantees unlock and client release in finally.
   * If the lock cannot be acquired immediately, returns false.
   * 
   * @param lockId A numeric ID for the lock
   * @param fn The function to execute if the lock is acquired
   * @returns The result of fn if lock acquired, or null if lock could not be acquired.
   */
  withAdvisoryLock<T>(lockId: number, fn: () => Promise<T>): Promise<T | null>;
}
