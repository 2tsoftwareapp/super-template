import type { components, operations } from "@repo/api-contract";

export type ApiEnvelope<T> = {
  data: T;
  meta: {
    requestId: string;
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

export type ApiErrorEnvelope = {
  error: {
    code: string;
    message: string;
    details: unknown;
  };
  meta: {
    requestId: string;
  };
};

export type LoginInput = components["schemas"]["LoginDto"];
export type RegisterInput = components["schemas"]["RegisterDto"];
export type ForgotPasswordInput = components["schemas"]["ForgotPasswordDto"];
export type ResetPasswordInput = components["schemas"]["ResetPasswordDto"];
export type VerifyEmailInput = components["schemas"]["VerifyEmailDto"];
export type UpdateProfileInput = components["schemas"]["UpdateProfileDto"];
export type ChangePasswordInput = components["schemas"]["ChangePasswordDto"];
export type CreateProjectInput = components["schemas"]["CreateProjectDto"];
export type UpdateProjectInput = components["schemas"]["UpdateProjectDto"];

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
