// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'serializers.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

Serializers _$serializers = (Serializers().toBuilder()
      ..add(AcceptInvitationDto.serializer)
      ..add(ActivitiesControllerList200Response.serializer)
      ..add(ActivityDto.serializer)
      ..add(ActivityDtoVisibilityEnum.serializer)
      ..add(AdminJobsControllerCancelJob200Response.serializer)
      ..add(AdminJobsControllerListJobs200Response.serializer)
      ..add(AdminMailControllerListDeliveries200Response.serializer)
      ..add(AdminMailControllerPreview200Response.serializer)
      ..add(AdminNotificationsControllerListJobs200Response.serializer)
      ..add(AdminNotificationsControllerSend201Response.serializer)
      ..add(AdminRolesControllerListRoles200Response.serializer)
      ..add(AdminSettingsControllerListSettings200Response.serializer)
      ..add(AdminSettingsControllerUpdateSetting200Response.serializer)
      ..add(AdminUsersControllerCreateUser201Response.serializer)
      ..add(AdminUsersControllerDeleteUser200Response.serializer)
      ..add(AdminUsersControllerListUsers200Response.serializer)
      ..add(ApplicationSettingDto.serializer)
      ..add(AttachEntityDto.serializer)
      ..add(AttachmentDto.serializer)
      ..add(AttachmentsControllerAttach201Response.serializer)
      ..add(AttachmentsControllerList200Response.serializer)
      ..add(AuditControllerListAuditLogs200Response.serializer)
      ..add(AuditLogDto.serializer)
      ..add(AuthControllerGetMe200Response.serializer)
      ..add(AuthControllerGetSessions200Response.serializer)
      ..add(AuthControllerLogin201Response.serializer)
      ..add(AuthControllerRegister201Response.serializer)
      ..add(AuthMeDto.serializer)
      ..add(AuthResponseDto.serializer)
      ..add(AuthSessionDto.serializer)
      ..add(ChangePasswordDto.serializer)
      ..add(CommentDto.serializer)
      ..add(CommentsControllerCreate201Response.serializer)
      ..add(CommentsControllerList200Response.serializer)
      ..add(CountDto.serializer)
      ..add(CreateAdminUserDto.serializer)
      ..add(CreateAdminUserDtoStatusEnum.serializer)
      ..add(CreateCommentDto.serializer)
      ..add(CreateExportDto.serializer)
      ..add(CreateImportDto.serializer)
      ..add(CreateInvitationDto.serializer)
      ..add(CreateOrganizationDto.serializer)
      ..add(CreateProjectDto.serializer)
      ..add(CreateProjectDtoStatusEnum.serializer)
      ..add(DeviceTokenDto.serializer)
      ..add(DeviceTokenDtoPlatformEnum.serializer)
      ..add(ExportJobDto.serializer)
      ..add(ExportJobDtoStatusEnum.serializer)
      ..add(ExportsControllerCreate201Response.serializer)
      ..add(FileDto.serializer)
      ..add(FileUrlDto.serializer)
      ..add(FilesControllerGetUrl200Response.serializer)
      ..add(FilesControllerUpload201Response.serializer)
      ..add(ForgotPasswordDto.serializer)
      ..add(HealthControllerGetHealth200Response.serializer)
      ..add(HealthStatusDto.serializer)
      ..add(HealthStatusDtoStatusEnum.serializer)
      ..add(ImportJobDto.serializer)
      ..add(ImportJobDtoStatusEnum.serializer)
      ..add(ImportsControllerCreate201Response.serializer)
      ..add(InvitationDto.serializer)
      ..add(InvitationDtoStatusEnum.serializer)
      ..add(InvitationsControllerCreate201Response.serializer)
      ..add(InvitationsControllerList200Response.serializer)
      ..add(JobDto.serializer)
      ..add(JobDtoStatusEnum.serializer)
      ..add(LoginDto.serializer)
      ..add(MailDeliveryDto.serializer)
      ..add(MailDeliveryDtoStatusEnum.serializer)
      ..add(MailPreviewDto.serializer)
      ..add(NotificationDto.serializer)
      ..add(NotificationJobDto.serializer)
      ..add(NotificationJobDtoAudienceEnum.serializer)
      ..add(NotificationJobDtoStatusEnum.serializer)
      ..add(NotificationsControllerList200Response.serializer)
      ..add(NotificationsControllerMarkRead200Response.serializer)
      ..add(NotificationsControllerRegisterDevice201Response.serializer)
      ..add(NotificationsControllerUnreadCount200Response.serializer)
      ..add(OrganizationDto.serializer)
      ..add(OrganizationDtoRoleEnum.serializer)
      ..add(OrganizationsControllerCreate200Response.serializer)
      ..add(OrganizationsControllerList200Response.serializer)
      ..add(PaginationMetaDto.serializer)
      ..add(PreferencesControllerGetMyPreferences200Response.serializer)
      ..add(ProjectAttachmentDto.serializer)
      ..add(ProjectDto.serializer)
      ..add(ProjectDtoStatusEnum.serializer)
      ..add(ProjectsControllerCreate201Response.serializer)
      ..add(ProjectsControllerList200Response.serializer)
      ..add(ProjectsControllerListAttachments200Response.serializer)
      ..add(RefreshTokenDto.serializer)
      ..add(RegisterDeviceDto.serializer)
      ..add(RegisterDeviceDtoPlatformEnum.serializer)
      ..add(RegisterDto.serializer)
      ..add(ReplaceUserRolesDto.serializer)
      ..add(RequestMetaDto.serializer)
      ..add(ResendVerificationDto.serializer)
      ..add(ResetPasswordDto.serializer)
      ..add(RoleDto.serializer)
      ..add(SendNotificationRequestDto.serializer)
      ..add(SendNotificationRequestDtoAudienceEnum.serializer)
      ..add(SuccessFlagDto.serializer)
      ..add(SuccessMessageDto.serializer)
      ..add(SwitchOrganizationDto.serializer)
      ..add(UpdateAdminUserDto.serializer)
      ..add(UpdateAdminUserDtoStatusEnum.serializer)
      ..add(UpdateCommentDto.serializer)
      ..add(UpdatePreferencesDto.serializer)
      ..add(UpdateProfileDto.serializer)
      ..add(UpdateProjectDto.serializer)
      ..add(UpdateProjectDtoStatusEnum.serializer)
      ..add(UpdateSettingDto.serializer)
      ..add(UpdateUserStatusDto.serializer)
      ..add(UpdateUserStatusDtoStatusEnum.serializer)
      ..add(UserDto.serializer)
      ..add(UserDtoStatusEnum.serializer)
      ..add(UserPreferencesDto.serializer)
      ..add(VerifyEmailDto.serializer)
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(ActivityDto)]),
          () => ListBuilder<ActivityDto>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(ApplicationSettingDto)]),
          () => ListBuilder<ApplicationSettingDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(AttachmentDto)]),
          () => ListBuilder<AttachmentDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(AuditLogDto)]),
          () => ListBuilder<AuditLogDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(AuthSessionDto)]),
          () => ListBuilder<AuthSessionDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(CommentDto)]),
          () => ListBuilder<CommentDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(InvitationDto)]),
          () => ListBuilder<InvitationDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JobDto)]),
          () => ListBuilder<JobDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(JsonObject)]),
          () => ListBuilder<JsonObject>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(MailDeliveryDto)]),
          () => ListBuilder<MailDeliveryDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(NotificationDto)]),
          () => ListBuilder<NotificationDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(NotificationJobDto)]),
          () => ListBuilder<NotificationJobDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(OrganizationDto)]),
          () => ListBuilder<OrganizationDto>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(ProjectAttachmentDto)]),
          () => ListBuilder<ProjectAttachmentDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(ProjectDto)]),
          () => ListBuilder<ProjectDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(RoleDto)]),
          () => ListBuilder<RoleDto>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(UserDto)]),
          () => ListBuilder<UserDto>())
      ..addBuilderFactory(
          const FullType(BuiltMap, const [
            const FullType(String),
            const FullType.nullable(JsonObject)
          ]),
          () => MapBuilder<String, JsonObject?>())
      ..addBuilderFactory(
          const FullType(BuiltMap, const [
            const FullType(String),
            const FullType.nullable(JsonObject)
          ]),
          () => MapBuilder<String, JsonObject?>())
      ..addBuilderFactory(
          const FullType(BuiltMap, const [
            const FullType(String),
            const FullType.nullable(JsonObject)
          ]),
          () => MapBuilder<String, JsonObject?>())
      ..addBuilderFactory(
          const FullType(BuiltMap, const [
            const FullType(String),
            const FullType.nullable(JsonObject)
          ]),
          () => MapBuilder<String, JsonObject?>())
      ..addBuilderFactory(
          const FullType(BuiltMap, const [
            const FullType(String),
            const FullType.nullable(JsonObject)
          ]),
          () => MapBuilder<String, JsonObject?>())
      ..addBuilderFactory(
          const FullType(BuiltMap, const [
            const FullType(String),
            const FullType.nullable(JsonObject)
          ]),
          () => MapBuilder<String, JsonObject?>())
      ..addBuilderFactory(
          const FullType(BuiltMap, const [
            const FullType(String),
            const FullType.nullable(JsonObject)
          ]),
          () => MapBuilder<String, JsonObject?>())
      ..addBuilderFactory(
          const FullType(BuiltMap, const [
            const FullType(String),
            const FullType.nullable(JsonObject)
          ]),
          () => MapBuilder<String, JsonObject?>())
      ..addBuilderFactory(
          const FullType(BuiltMap, const [
            const FullType(String),
            const FullType.nullable(JsonObject)
          ]),
          () => MapBuilder<String, JsonObject?>())
      ..addBuilderFactory(
          const FullType(BuiltMap, const [
            const FullType(String),
            const FullType.nullable(JsonObject)
          ]),
          () => MapBuilder<String, JsonObject?>())
      ..addBuilderFactory(
          const FullType(BuiltMap, const [
            const FullType(String),
            const FullType.nullable(JsonObject)
          ]),
          () => MapBuilder<String, JsonObject?>())
      ..addBuilderFactory(
          const FullType(BuiltMap, const [
            const FullType(String),
            const FullType.nullable(JsonObject)
          ]),
          () => MapBuilder<String, JsonObject?>()))
    .build();

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
