import { PERMISSION_NAMES, ROLE_NAMES } from '../access-control.constants';

export interface RoleSeedEntry {
  name: string;
  description: string;
}

export interface PermissionSeedEntry {
  name: string;
  description: string;
}

export const ROLE_SEED_ENTRIES: RoleSeedEntry[] = [
  { name: ROLE_NAMES.SUPER_ADMIN, description: 'Platform owner role' },
  { name: ROLE_NAMES.ADMIN, description: 'Administrative role' },
  { name: ROLE_NAMES.USER, description: 'Standard user role' },
];

export const PERMISSION_SEED_ENTRIES: PermissionSeedEntry[] = [
  { name: PERMISSION_NAMES.USERS_READ, description: 'Read users' },
  { name: PERMISSION_NAMES.USERS_CREATE, description: 'Create users' },
  { name: PERMISSION_NAMES.USERS_UPDATE, description: 'Update users' },
  { name: PERMISSION_NAMES.USERS_DELETE, description: 'Delete users' },
  { name: PERMISSION_NAMES.ROLES_READ, description: 'Read roles' },
  { name: PERMISSION_NAMES.ROLES_MANAGE, description: 'Manage roles' },
  { name: PERMISSION_NAMES.PROJECTS_READ, description: 'Read projects' },
  { name: PERMISSION_NAMES.PROJECTS_CREATE, description: 'Create projects' },
  { name: PERMISSION_NAMES.PROJECTS_UPDATE, description: 'Update projects' },
  { name: PERMISSION_NAMES.PROJECTS_DELETE, description: 'Delete projects' },
  { name: PERMISSION_NAMES.NOTIFICATIONS_READ, description: 'Read notifications' },
  { name: PERMISSION_NAMES.NOTIFICATIONS_SEND, description: 'Send notifications' },
  { name: PERMISSION_NAMES.AUDIT_READ, description: 'Read audit logs' },
  { name: PERMISSION_NAMES.FILES_UPLOAD, description: 'Upload files' },
  { name: PERMISSION_NAMES.FILES_READ, description: 'Read files' },
  { name: PERMISSION_NAMES.FILES_DELETE, description: 'Delete files' },
  { name: PERMISSION_NAMES.ATTACHMENTS_MANAGE, description: 'Manage attachments' },
  { name: PERMISSION_NAMES.SETTINGS_MANAGE, description: 'Manage application settings' },
  { name: PERMISSION_NAMES.SETTINGS_READ, description: 'Read application settings' },
  { name: PERMISSION_NAMES.JOBS_READ, description: 'Read jobs' },
  { name: PERMISSION_NAMES.JOBS_MANAGE, description: 'Manage jobs' },
  { name: PERMISSION_NAMES.INVITATIONS_CREATE, description: 'Create invitations' },
  { name: PERMISSION_NAMES.INVITATIONS_READ, description: 'Read invitations' },
  { name: PERMISSION_NAMES.IMPORTS_MANAGE, description: 'Manage import jobs' },
  { name: PERMISSION_NAMES.EXPORTS_MANAGE, description: 'Manage export jobs' },
  { name: PERMISSION_NAMES.COMMENTS_READ, description: 'Read comments' },
  { name: PERMISSION_NAMES.COMMENTS_CREATE, description: 'Create comments' },
  { name: PERMISSION_NAMES.COMMENTS_MODERATE, description: 'Moderate comments' },
  { name: PERMISSION_NAMES.ACTIVITIES_READ, description: 'Read activities' },
  { name: PERMISSION_NAMES.PROJECTS_INVITE, description: 'Invite project collaborators' },
  { name: PERMISSION_NAMES.MAIL_READ, description: 'Read mail deliveries' },
];
