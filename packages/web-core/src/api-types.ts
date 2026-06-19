import type { components, operations } from "@repo/api-contract";

import type { JsonValue } from "./json";

export interface ApiEnvelope<T> {
  data: T;
  meta: {
    requestId: string;
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details: JsonValue | null;
  };
  meta: {
    requestId: string;
  };
}

export type LoginInput = components["schemas"]["LoginDto"];
export type RegisterInput = components["schemas"]["RegisterDto"];
export type ForgotPasswordInput = components["schemas"]["ForgotPasswordDto"];
export type ResetPasswordInput = components["schemas"]["ResetPasswordDto"];
export type VerifyEmailInput = components["schemas"]["VerifyEmailDto"];
export type UpdateProfileInput = components["schemas"]["UpdateProfileDto"];
export type ChangePasswordInput = components["schemas"]["ChangePasswordDto"];
export type CreateProjectInput = components["schemas"]["CreateProjectDto"];
export type UpdateProjectInput = components["schemas"]["UpdateProjectDto"];
export type CreateAdminUserInput = components["schemas"]["CreateAdminUserDto"];
export type UpdateAdminUserInput = components["schemas"]["UpdateAdminUserDto"];
export type UpdateUserStatusInput =
  components["schemas"]["UpdateUserStatusDto"];
export type ReplaceUserRolesInput =
  components["schemas"]["ReplaceUserRolesDto"];
export type CreateImportInput = components["schemas"]["CreateImportDto"];
export type UpdateSettingInput = components["schemas"]["UpdateSettingDto"];
export type SendNotificationInput =
  components["schemas"]["SendNotificationRequestDto"];

export type AuthLoginResponse =
  operations["AuthController_login"]["responses"][201]["content"]["application/json"];
export type AuthSessionResponse =
  operations["AuthController_getMe"]["responses"][200]["content"]["application/json"];
export type AuthSessionsResponse =
  operations["AuthController_getSessions"]["responses"][200]["content"]["application/json"];
export type UsersListResponse =
  operations["AdminUsersController_listUsers"]["responses"][200]["content"]["application/json"];
export type ProjectsListResponse =
  operations["ProjectsController_list"]["responses"][200]["content"]["application/json"];
export type ProjectResponse =
  operations["ProjectsController_getById"]["responses"][200]["content"]["application/json"];
export type NotificationsListResponse =
  operations["NotificationsController_list"]["responses"][200]["content"]["application/json"];
export type NotificationsUnreadResponse =
  operations["NotificationsController_unreadCount"]["responses"][200]["content"]["application/json"];
export type AuditLogsListResponse =
  operations["AuditController_listAuditLogs"]["responses"][200]["content"]["application/json"];

export type UserDto = components["schemas"]["UserDto"];
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
export type ProjectDto = components["schemas"]["ProjectDto"];
export type ProjectAttachmentDto =
  components["schemas"]["ProjectAttachmentDto"];

export interface SessionUser {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
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
