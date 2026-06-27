//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_import

// @dart=3.0

import 'package:one_of_serializer/any_of_serializer.dart';
import 'package:one_of_serializer/one_of_serializer.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/serializer.dart';
import 'package:built_value/standard_json_plugin.dart';
import 'package:built_value/iso_8601_date_time_serializer.dart';
import 'package:super_template_api/src/date_serializer.dart';
import 'package:super_template_api/src/model/date.dart';

import 'package:super_template_api/src/model/accept_invitation_dto.dart';
import 'package:super_template_api/src/model/activities_controller_list200_response.dart';
import 'package:super_template_api/src/model/activity_dto.dart';
import 'package:super_template_api/src/model/add_job_dependency_dto.dart';
import 'package:super_template_api/src/model/admin_jobs_controller_add_dependency201_response.dart';
import 'package:super_template_api/src/model/admin_jobs_controller_get_job200_response.dart';
import 'package:super_template_api/src/model/admin_jobs_controller_get_job_logs200_response.dart';
import 'package:super_template_api/src/model/admin_jobs_controller_get_metrics200_response.dart';
import 'package:super_template_api/src/model/admin_jobs_controller_list_dependencies200_response.dart';
import 'package:super_template_api/src/model/admin_jobs_controller_list_jobs200_response.dart';
import 'package:super_template_api/src/model/admin_mail_controller_list_deliveries200_response.dart';
import 'package:super_template_api/src/model/admin_mail_controller_list_templates200_response.dart';
import 'package:super_template_api/src/model/admin_mail_controller_preview200_response.dart';
import 'package:super_template_api/src/model/admin_mail_controller_send201_response.dart';
import 'package:super_template_api/src/model/admin_notifications_controller_list_jobs200_response.dart';
import 'package:super_template_api/src/model/admin_notifications_controller_send201_response.dart';
import 'package:super_template_api/src/model/admin_roles_controller_create_role201_response.dart';
import 'package:super_template_api/src/model/admin_roles_controller_delete_role200_response.dart';
import 'package:super_template_api/src/model/admin_roles_controller_list_permissions200_response.dart';
import 'package:super_template_api/src/model/admin_roles_controller_list_roles200_response.dart';
import 'package:super_template_api/src/model/admin_settings_controller_list_settings200_response.dart';
import 'package:super_template_api/src/model/admin_settings_controller_update_setting200_response.dart';
import 'package:super_template_api/src/model/admin_users_controller_create_user201_response.dart';
import 'package:super_template_api/src/model/admin_users_controller_list_users200_response.dart';
import 'package:super_template_api/src/model/application_setting_dto.dart';
import 'package:super_template_api/src/model/attach_entity_dto.dart';
import 'package:super_template_api/src/model/attachment_dto.dart';
import 'package:super_template_api/src/model/attachments_controller_attach201_response.dart';
import 'package:super_template_api/src/model/attachments_controller_list200_response.dart';
import 'package:super_template_api/src/model/audit_controller_export_audit_logs201_response.dart';
import 'package:super_template_api/src/model/audit_controller_get_audit_log200_response.dart';
import 'package:super_template_api/src/model/audit_controller_list_audit_logs200_response.dart';
import 'package:super_template_api/src/model/audit_export_result_dto.dart';
import 'package:super_template_api/src/model/audit_log_dto.dart';
import 'package:super_template_api/src/model/auth_controller_get_me200_response.dart';
import 'package:super_template_api/src/model/auth_controller_get_sessions200_response.dart';
import 'package:super_template_api/src/model/auth_controller_login201_response.dart';
import 'package:super_template_api/src/model/auth_controller_register201_response.dart';
import 'package:super_template_api/src/model/auth_controller_switch_organization201_response.dart';
import 'package:super_template_api/src/model/auth_controller_verify_mfa_challenge201_response.dart';
import 'package:super_template_api/src/model/auth_me_dto.dart';
import 'package:super_template_api/src/model/auth_response_dto.dart';
import 'package:super_template_api/src/model/auth_session_dto.dart';
import 'package:super_template_api/src/model/batch_delete_files_dto.dart';
import 'package:super_template_api/src/model/batch_delete_result_dto.dart';
import 'package:super_template_api/src/model/batch_delete_result_item_dto.dart';
import 'package:super_template_api/src/model/change_password_dto.dart';
import 'package:super_template_api/src/model/comment_dto.dart';
import 'package:super_template_api/src/model/comments_controller_create201_response.dart';
import 'package:super_template_api/src/model/comments_controller_list200_response.dart';
import 'package:super_template_api/src/model/count_dto.dart';
import 'package:super_template_api/src/model/create_admin_user_dto.dart';
import 'package:super_template_api/src/model/create_comment_dto.dart';
import 'package:super_template_api/src/model/create_export_dto.dart';
import 'package:super_template_api/src/model/create_import_dto.dart';
import 'package:super_template_api/src/model/create_invitation_dto.dart';
import 'package:super_template_api/src/model/create_organization_dto.dart';
import 'package:super_template_api/src/model/create_project_dto.dart';
import 'package:super_template_api/src/model/create_role_dto.dart';
import 'package:super_template_api/src/model/device_token_dto.dart';
import 'package:super_template_api/src/model/exchange_sso_session_dto.dart';
import 'package:super_template_api/src/model/export_audit_logs_query_dto.dart';
import 'package:super_template_api/src/model/export_job_dto.dart';
import 'package:super_template_api/src/model/exports_controller_create201_response.dart';
import 'package:super_template_api/src/model/file_dto.dart';
import 'package:super_template_api/src/model/file_history_event_dto.dart';
import 'package:super_template_api/src/model/file_url_dto.dart';
import 'package:super_template_api/src/model/file_version_dto.dart';
import 'package:super_template_api/src/model/files_controller_batch_delete201_response.dart';
import 'package:super_template_api/src/model/files_controller_get_history200_response.dart';
import 'package:super_template_api/src/model/files_controller_get_url200_response.dart';
import 'package:super_template_api/src/model/files_controller_list200_response.dart';
import 'package:super_template_api/src/model/files_controller_list_versions200_response.dart';
import 'package:super_template_api/src/model/files_controller_upload201_response.dart';
import 'package:super_template_api/src/model/forgot_password_dto.dart';
import 'package:super_template_api/src/model/health_controller_get_health200_response.dart';
import 'package:super_template_api/src/model/health_status_dto.dart';
import 'package:super_template_api/src/model/import_job_dto.dart';
import 'package:super_template_api/src/model/imports_controller_create201_response.dart';
import 'package:super_template_api/src/model/invitation_dto.dart';
import 'package:super_template_api/src/model/invitations_controller_create201_response.dart';
import 'package:super_template_api/src/model/invitations_controller_list200_response.dart';
import 'package:super_template_api/src/model/job_dependency_dto.dart';
import 'package:super_template_api/src/model/job_dto.dart';
import 'package:super_template_api/src/model/job_event_dto.dart';
import 'package:super_template_api/src/model/job_metrics_dto.dart';
import 'package:super_template_api/src/model/job_status_count_dto.dart';
import 'package:super_template_api/src/model/job_type_count_dto.dart';
import 'package:super_template_api/src/model/login_dto.dart';
import 'package:super_template_api/src/model/login_response_dto.dart';
import 'package:super_template_api/src/model/mail_delivery_dto.dart';
import 'package:super_template_api/src/model/mail_preview_dto.dart';
import 'package:super_template_api/src/model/mail_template_dto.dart';
import 'package:super_template_api/src/model/mfa_code_dto.dart';
import 'package:super_template_api/src/model/mfa_controller_confirm201_response.dart';
import 'package:super_template_api/src/model/mfa_controller_get_status200_response.dart';
import 'package:super_template_api/src/model/mfa_controller_setup201_response.dart';
import 'package:super_template_api/src/model/mfa_recovery_codes_response_dto.dart';
import 'package:super_template_api/src/model/mfa_setup_response_dto.dart';
import 'package:super_template_api/src/model/mfa_status_dto.dart';
import 'package:super_template_api/src/model/notification_dto.dart';
import 'package:super_template_api/src/model/notification_job_dto.dart';
import 'package:super_template_api/src/model/notifications_controller_list200_response.dart';
import 'package:super_template_api/src/model/notifications_controller_mark_read200_response.dart';
import 'package:super_template_api/src/model/notifications_controller_register_device201_response.dart';
import 'package:super_template_api/src/model/notifications_controller_unread_count200_response.dart';
import 'package:super_template_api/src/model/organization_detail_dto.dart';
import 'package:super_template_api/src/model/organization_dto.dart';
import 'package:super_template_api/src/model/organization_member_dto.dart';
import 'package:super_template_api/src/model/organizations_controller_create200_response.dart';
import 'package:super_template_api/src/model/organizations_controller_get_one200_response.dart';
import 'package:super_template_api/src/model/organizations_controller_list200_response.dart';
import 'package:super_template_api/src/model/organizations_controller_list_members200_response.dart';
import 'package:super_template_api/src/model/organizations_controller_update_member_role200_response.dart';
import 'package:super_template_api/src/model/pagination_meta_dto.dart';
import 'package:super_template_api/src/model/permission_dto.dart';
import 'package:super_template_api/src/model/preferences_controller_get_my_preferences200_response.dart';
import 'package:super_template_api/src/model/project_attachment_dto.dart';
import 'package:super_template_api/src/model/project_dto.dart';
import 'package:super_template_api/src/model/projects_controller_create201_response.dart';
import 'package:super_template_api/src/model/projects_controller_list200_response.dart';
import 'package:super_template_api/src/model/projects_controller_list_attachments200_response.dart';
import 'package:super_template_api/src/model/refresh_token_dto.dart';
import 'package:super_template_api/src/model/register_device_dto.dart';
import 'package:super_template_api/src/model/register_dto.dart';
import 'package:super_template_api/src/model/replace_role_permissions_dto.dart';
import 'package:super_template_api/src/model/replace_user_roles_dto.dart';
import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/resend_verification_dto.dart';
import 'package:super_template_api/src/model/reset_password_dto.dart';
import 'package:super_template_api/src/model/role_dto.dart';
import 'package:super_template_api/src/model/send_admin_mail_dto.dart';
import 'package:super_template_api/src/model/send_admin_mail_result_dto.dart';
import 'package:super_template_api/src/model/send_notification_request_dto.dart';
import 'package:super_template_api/src/model/sso_callback_query_dto.dart';
import 'package:super_template_api/src/model/sso_controller_start_login200_response.dart';
import 'package:super_template_api/src/model/start_sso_login_response_dto.dart';
import 'package:super_template_api/src/model/success_flag_dto.dart';
import 'package:super_template_api/src/model/success_message_dto.dart';
import 'package:super_template_api/src/model/switch_organization_dto.dart';
import 'package:super_template_api/src/model/switch_organization_response_dto.dart';
import 'package:super_template_api/src/model/update_admin_user_dto.dart';
import 'package:super_template_api/src/model/update_comment_dto.dart';
import 'package:super_template_api/src/model/update_member_role_dto.dart';
import 'package:super_template_api/src/model/update_organization_dto.dart';
import 'package:super_template_api/src/model/update_preferences_dto.dart';
import 'package:super_template_api/src/model/update_profile_dto.dart';
import 'package:super_template_api/src/model/update_project_dto.dart';
import 'package:super_template_api/src/model/update_role_dto.dart';
import 'package:super_template_api/src/model/update_setting_dto.dart';
import 'package:super_template_api/src/model/update_user_status_dto.dart';
import 'package:super_template_api/src/model/user_dto.dart';
import 'package:super_template_api/src/model/user_preferences_dto.dart';
import 'package:super_template_api/src/model/verify_email_dto.dart';
import 'package:super_template_api/src/model/verify_mfa_challenge_dto.dart';

part 'serializers.g.dart';

@SerializersFor([
  AcceptInvitationDto,
  ActivitiesControllerList200Response,
  ActivityDto,
  AddJobDependencyDto,
  AdminJobsControllerAddDependency201Response,
  AdminJobsControllerGetJob200Response,
  AdminJobsControllerGetJobLogs200Response,
  AdminJobsControllerGetMetrics200Response,
  AdminJobsControllerListDependencies200Response,
  AdminJobsControllerListJobs200Response,
  AdminMailControllerListDeliveries200Response,
  AdminMailControllerListTemplates200Response,
  AdminMailControllerPreview200Response,
  AdminMailControllerSend201Response,
  AdminNotificationsControllerListJobs200Response,
  AdminNotificationsControllerSend201Response,
  AdminRolesControllerCreateRole201Response,
  AdminRolesControllerDeleteRole200Response,
  AdminRolesControllerListPermissions200Response,
  AdminRolesControllerListRoles200Response,
  AdminSettingsControllerListSettings200Response,
  AdminSettingsControllerUpdateSetting200Response,
  AdminUsersControllerCreateUser201Response,
  AdminUsersControllerListUsers200Response,
  ApplicationSettingDto,
  AttachEntityDto,
  AttachmentDto,
  AttachmentsControllerAttach201Response,
  AttachmentsControllerList200Response,
  AuditControllerExportAuditLogs201Response,
  AuditControllerGetAuditLog200Response,
  AuditControllerListAuditLogs200Response,
  AuditExportResultDto,
  AuditLogDto,
  AuthControllerGetMe200Response,
  AuthControllerGetSessions200Response,
  AuthControllerLogin201Response,
  AuthControllerRegister201Response,
  AuthControllerSwitchOrganization201Response,
  AuthControllerVerifyMfaChallenge201Response,
  AuthMeDto,
  AuthResponseDto,
  AuthSessionDto,
  BatchDeleteFilesDto,
  BatchDeleteResultDto,
  BatchDeleteResultItemDto,
  ChangePasswordDto,
  CommentDto,
  CommentsControllerCreate201Response,
  CommentsControllerList200Response,
  CountDto,
  CreateAdminUserDto,
  CreateCommentDto,
  CreateExportDto,
  CreateImportDto,
  CreateInvitationDto,
  CreateOrganizationDto,
  CreateProjectDto,
  CreateRoleDto,
  DeviceTokenDto,
  ExchangeSsoSessionDto,
  ExportAuditLogsQueryDto,
  ExportJobDto,
  ExportsControllerCreate201Response,
  FileDto,
  FileHistoryEventDto,
  FileUrlDto,
  FileVersionDto,
  FilesControllerBatchDelete201Response,
  FilesControllerGetHistory200Response,
  FilesControllerGetUrl200Response,
  FilesControllerList200Response,
  FilesControllerListVersions200Response,
  FilesControllerUpload201Response,
  ForgotPasswordDto,
  HealthControllerGetHealth200Response,
  HealthStatusDto,
  ImportJobDto,
  ImportsControllerCreate201Response,
  InvitationDto,
  InvitationsControllerCreate201Response,
  InvitationsControllerList200Response,
  JobDependencyDto,
  JobDto,
  JobEventDto,
  JobMetricsDto,
  JobStatusCountDto,
  JobTypeCountDto,
  LoginDto,
  LoginResponseDto,
  MailDeliveryDto,
  MailPreviewDto,
  MailTemplateDto,
  MfaCodeDto,
  MfaControllerConfirm201Response,
  MfaControllerGetStatus200Response,
  MfaControllerSetup201Response,
  MfaRecoveryCodesResponseDto,
  MfaSetupResponseDto,
  MfaStatusDto,
  NotificationDto,
  NotificationJobDto,
  NotificationsControllerList200Response,
  NotificationsControllerMarkRead200Response,
  NotificationsControllerRegisterDevice201Response,
  NotificationsControllerUnreadCount200Response,
  OrganizationDetailDto,
  OrganizationDto,
  OrganizationMemberDto,
  OrganizationsControllerCreate200Response,
  OrganizationsControllerGetOne200Response,
  OrganizationsControllerList200Response,
  OrganizationsControllerListMembers200Response,
  OrganizationsControllerUpdateMemberRole200Response,
  PaginationMetaDto,
  PermissionDto,
  PreferencesControllerGetMyPreferences200Response,
  ProjectAttachmentDto,
  ProjectDto,
  ProjectsControllerCreate201Response,
  ProjectsControllerList200Response,
  ProjectsControllerListAttachments200Response,
  RefreshTokenDto,
  RegisterDeviceDto,
  RegisterDto,
  ReplaceRolePermissionsDto,
  ReplaceUserRolesDto,
  RequestMetaDto,
  ResendVerificationDto,
  ResetPasswordDto,
  RoleDto,
  SendAdminMailDto,
  SendAdminMailResultDto,
  SendNotificationRequestDto,
  SsoCallbackQueryDto,
  SsoControllerStartLogin200Response,
  StartSsoLoginResponseDto,
  SuccessFlagDto,
  SuccessMessageDto,
  SwitchOrganizationDto,
  SwitchOrganizationResponseDto,
  UpdateAdminUserDto,
  UpdateCommentDto,
  UpdateMemberRoleDto,
  UpdateOrganizationDto,
  UpdatePreferencesDto,
  UpdateProfileDto,
  UpdateProjectDto,
  UpdateRoleDto,
  UpdateSettingDto,
  UpdateUserStatusDto,
  UserDto,
  UserPreferencesDto,
  VerifyEmailDto,
  VerifyMfaChallengeDto,
])
Serializers serializers = (_$serializers.toBuilder()
      ..add(const OneOfSerializer())
      ..add(const AnyOfSerializer())
      ..add(const DateSerializer())
      ..add(Iso8601DateTimeSerializer()))
    .build();

Serializers standardSerializers =
    (serializers.toBuilder()..addPlugin(StandardJsonPlugin())).build();
