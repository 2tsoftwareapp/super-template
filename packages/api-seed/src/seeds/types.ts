export interface SeededUsersContext {
  // The admin account drives privileged fixture ownership and the baseline auth session.
  adminUserId: string;
  // Each seeded user gets its own personal organization so downstream fixtures can stay tenant-aware.
  adminOrganizationId: string;
  // The regular account is the non-privileged reference user for app-level demo data.
  regularUserId: string;
  // This organization is used by user-owned projects, notifications, and other tenant-bound records.
  regularOrganizationId: string;
}
