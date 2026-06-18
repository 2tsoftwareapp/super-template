import { PERMISSION_NAMES, ROLE_NAMES } from '../access-control.constants';

export interface RoleSeedEntry {
  name: string;
  description: string;
  isSystem: boolean;
}

export interface PermissionSeedEntry {
  name: string;
  description: string;
  isSystem: boolean;
}

export const ROLE_SEED_ENTRIES: RoleSeedEntry[] = [
  {
    name: ROLE_NAMES.SUPER_ADMIN,
    description: 'Platform owner role',
    isSystem: true,
  },
  { name: ROLE_NAMES.ADMIN, description: 'Administrative role', isSystem: true },
  { name: ROLE_NAMES.USER, description: 'Standard user role', isSystem: true },
];

export const PERMISSION_SEED_ENTRIES: PermissionSeedEntry[] = [
  { name: PERMISSION_NAMES.USERS_READ, description: 'Read users', isSystem: true },
  { name: PERMISSION_NAMES.USERS_CREATE, description: 'Create users', isSystem: true },
  { name: PERMISSION_NAMES.USERS_UPDATE, description: 'Update users', isSystem: true },
  { name: PERMISSION_NAMES.USERS_DELETE, description: 'Delete users', isSystem: true },
  { name: PERMISSION_NAMES.ROLES_READ, description: 'Read roles', isSystem: true },
  { name: PERMISSION_NAMES.ROLES_MANAGE, description: 'Manage roles', isSystem: true },
  { name: PERMISSION_NAMES.PROJECTS_READ, description: 'Read projects', isSystem: true },
  { name: PERMISSION_NAMES.PROJECTS_CREATE, description: 'Create projects', isSystem: true },
  { name: PERMISSION_NAMES.PROJECTS_UPDATE, description: 'Update projects', isSystem: true },
  { name: PERMISSION_NAMES.PROJECTS_DELETE, description: 'Delete projects', isSystem: true },
  { name: PERMISSION_NAMES.NOTIFICATIONS_READ, description: 'Read notifications', isSystem: true },
  { name: PERMISSION_NAMES.NOTIFICATIONS_SEND, description: 'Send notifications', isSystem: true },
  { name: PERMISSION_NAMES.AUDIT_READ, description: 'Read audit logs', isSystem: true },
  { name: PERMISSION_NAMES.FILES_UPLOAD, description: 'Upload files', isSystem: true },
  { name: PERMISSION_NAMES.FILES_READ, description: 'Read files', isSystem: true },
  { name: PERMISSION_NAMES.FILES_DELETE, description: 'Delete files', isSystem: true },
  { name: PERMISSION_NAMES.ATTACHMENTS_MANAGE, description: 'Manage attachments', isSystem: true },
  { name: PERMISSION_NAMES.SETTINGS_MANAGE, description: 'Manage application settings', isSystem: true },
  { name: PERMISSION_NAMES.SETTINGS_READ, description: 'Read application settings', isSystem: true },
  { name: PERMISSION_NAMES.JOBS_READ, description: 'Read jobs', isSystem: true },
  { name: PERMISSION_NAMES.JOBS_MANAGE, description: 'Manage jobs', isSystem: true },
  { name: PERMISSION_NAMES.INVITATIONS_CREATE, description: 'Create invitations', isSystem: true },
  { name: PERMISSION_NAMES.INVITATIONS_READ, description: 'Read invitations', isSystem: true },
  { name: PERMISSION_NAMES.IMPORTS_MANAGE, description: 'Manage import jobs', isSystem: true },
  { name: PERMISSION_NAMES.EXPORTS_MANAGE, description: 'Manage export jobs', isSystem: true },
  { name: PERMISSION_NAMES.COMMENTS_READ, description: 'Read comments', isSystem: true },
  { name: PERMISSION_NAMES.COMMENTS_CREATE, description: 'Create comments', isSystem: true },
  { name: PERMISSION_NAMES.COMMENTS_MODERATE, description: 'Moderate comments', isSystem: true },
  { name: PERMISSION_NAMES.ACTIVITIES_READ, description: 'Read activities', isSystem: true },
  { name: PERMISSION_NAMES.PROJECTS_INVITE, description: 'Invite project collaborators', isSystem: true },
  { name: PERMISSION_NAMES.MAIL_READ, description: 'Read mail deliveries', isSystem: true },
];
