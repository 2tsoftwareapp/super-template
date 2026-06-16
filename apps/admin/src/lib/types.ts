import type { components } from "@repo/api-contract";

export interface SessionUser {
  id: string;
  displayName: string;
  email: string;
  roles: string[];
}

export interface SessionResponse {
  data: {
    user: SessionUser;
    permissions: string[];
  };
}

export interface ProjectRow {
  id: string;
  name: string;
  status: string;
  description?: string | null;
  updatedAt?: string;
}

export interface UserRow {
  id: string;
  displayName: string;
  email: string;
  status: string;
  roles: string[];
  createdAt?: string;
}

export interface ListResponse<T> {
  data: T[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export type AdminUserDto = components["schemas"]["UserDto"];
export type RoleDto = components["schemas"]["RoleDto"];
export type AuditLogDto = components["schemas"]["AuditLogDto"];
export type JobDto = components["schemas"]["JobDto"];
export type NotificationDto = components["schemas"]["NotificationDto"];
export type NotificationJobDto = components["schemas"]["NotificationJobDto"];
export type MailDeliveryDto = components["schemas"]["MailDeliveryDto"];
export type MailPreviewDto = components["schemas"]["MailPreviewDto"];
export type ApplicationSettingDto =
  components["schemas"]["ApplicationSettingDto"];
export type ImportJobDto = components["schemas"]["ImportJobDto"];
export type CreateAdminUserInput = components["schemas"]["CreateAdminUserDto"];
export type UpdateAdminUserInput = components["schemas"]["UpdateAdminUserDto"];
export type UpdateUserStatusInput = components["schemas"]["UpdateUserStatusDto"];
export type ReplaceUserRolesInput =
  components["schemas"]["ReplaceUserRolesDto"];
export type CreateImportInput = components["schemas"]["CreateImportDto"];
export type UpdateSettingInput = components["schemas"]["UpdateSettingDto"];
export type SendNotificationInput =
  components["schemas"]["SendNotificationRequestDto"];
export type ProjectDto = components["schemas"]["ProjectDto"];
export type CreateProjectInput = components["schemas"]["CreateProjectDto"];
export type UpdateProjectInput = components["schemas"]["UpdateProjectDto"];
export type ProjectAttachmentDto = components["schemas"]["ProjectAttachmentDto"];
