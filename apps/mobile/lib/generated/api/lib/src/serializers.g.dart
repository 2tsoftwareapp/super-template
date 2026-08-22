// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'serializers.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

Serializers _$serializers = (Serializers().toBuilder()
      ..add(ActivitiesControllerList200Response.serializer)
      ..add(ActivityDto.serializer)
      ..add(ActivityDtoVisibilityEnum.serializer)
      ..add(AddJobDependencyDto.serializer)
      ..add(AdminJobsControllerAddDependency201Response.serializer)
      ..add(AdminJobsControllerGetJob200Response.serializer)
      ..add(AdminJobsControllerGetJobLogs200Response.serializer)
      ..add(AdminJobsControllerGetMetrics200Response.serializer)
      ..add(AdminJobsControllerListDependencies200Response.serializer)
      ..add(AdminJobsControllerListJobs200Response.serializer)
      ..add(AdminMailControllerListDeliveries200Response.serializer)
      ..add(AdminMailControllerListTemplates200Response.serializer)
      ..add(AdminMailControllerPreview200Response.serializer)
      ..add(AdminMailControllerSend201Response.serializer)
      ..add(AdminNotificationsControllerListJobs200Response.serializer)
      ..add(AdminNotificationsControllerSend201Response.serializer)
      ..add(AdminRolesControllerCreateRole201Response.serializer)
      ..add(AdminRolesControllerDeleteRole200Response.serializer)
      ..add(AdminRolesControllerListPermissions200Response.serializer)
      ..add(AdminRolesControllerListRoles200Response.serializer)
      ..add(AdminSettingsControllerListSettings200Response.serializer)
      ..add(AdminSettingsControllerUpdateSetting200Response.serializer)
      ..add(AdminUsersControllerCreateUser201Response.serializer)
      ..add(AdminUsersControllerListUsers200Response.serializer)
      ..add(ApplicationSettingDto.serializer)
      ..add(AttachEntityDto.serializer)
      ..add(AttachmentDto.serializer)
      ..add(AttachmentsControllerAttach201Response.serializer)
      ..add(AttachmentsControllerList200Response.serializer)
      ..add(AuditControllerExportAuditLogs201Response.serializer)
      ..add(AuditControllerGetAuditLog200Response.serializer)
      ..add(AuditControllerListAuditLogs200Response.serializer)
      ..add(AuditExportResultDto.serializer)
      ..add(AuditLogDto.serializer)
      ..add(AuthLoginControllerLogin201Response.serializer)
      ..add(AuthLoginControllerVerifyMfaChallenge201Response.serializer)
      ..add(AuthMeDto.serializer)
      ..add(AuthRegistrationControllerRegister201Response.serializer)
      ..add(AuthResponseDto.serializer)
      ..add(AuthSessionControllerGetMe200Response.serializer)
      ..add(AuthSessionControllerGetSessions200Response.serializer)
      ..add(AuthSessionControllerSwitchOrganization201Response.serializer)
      ..add(AuthSessionDto.serializer)
      ..add(BatchDeleteFilesDto.serializer)
      ..add(BatchDeleteResultDto.serializer)
      ..add(BatchDeleteResultItemDto.serializer)
      ..add(ChangePasswordDto.serializer)
      ..add(CountDto.serializer)
      ..add(CreateAdminUserDto.serializer)
      ..add(CreateAdminUserDtoStatusEnum.serializer)
      ..add(CreateExportDto.serializer)
      ..add(CreateImportDto.serializer)
      ..add(CreateImportDtoTypeEnum.serializer)
      ..add(CreateOrganizationDto.serializer)
      ..add(CreateRoleDto.serializer)
      ..add(DeviceTokenDto.serializer)
      ..add(DeviceTokenDtoPlatformEnum.serializer)
      ..add(ExchangeSsoSessionDto.serializer)
      ..add(ExportAuditLogsQueryDto.serializer)
      ..add(ExportJobDto.serializer)
      ..add(ExportJobDtoStatusEnum.serializer)
      ..add(ExportsControllerCreate201Response.serializer)
      ..add(FileDto.serializer)
      ..add(FileHistoryEventDto.serializer)
      ..add(FileHistoryEventDtoTypeEnum.serializer)
      ..add(FileUrlDto.serializer)
      ..add(FileVersionDto.serializer)
      ..add(FilesControllerBatchDelete201Response.serializer)
      ..add(FilesControllerGetHistory200Response.serializer)
      ..add(FilesControllerGetUrl200Response.serializer)
      ..add(FilesControllerList200Response.serializer)
      ..add(FilesControllerListVersions200Response.serializer)
      ..add(FilesControllerUpload201Response.serializer)
      ..add(ForgotPasswordDto.serializer)
      ..add(HealthControllerGetHealth200Response.serializer)
      ..add(HealthStatusDto.serializer)
      ..add(HealthStatusDtoStatusEnum.serializer)
      ..add(ImportJobDto.serializer)
      ..add(ImportJobDtoStatusEnum.serializer)
      ..add(ImportsControllerCreate201Response.serializer)
      ..add(JobDependencyDto.serializer)
      ..add(JobDependencyDtoDependsOnJobStatusEnum.serializer)
      ..add(JobDto.serializer)
      ..add(JobDtoStatusEnum.serializer)
      ..add(JobEventDto.serializer)
      ..add(JobEventDtoTypeEnum.serializer)
      ..add(JobListDto.serializer)
      ..add(JobListDtoStatusEnum.serializer)
      ..add(JobMetricsDto.serializer)
      ..add(JobStatusCountDto.serializer)
      ..add(JobTypeCountDto.serializer)
      ..add(LoginDto.serializer)
      ..add(LoginResponseDto.serializer)
      ..add(MailDeliveryDto.serializer)
      ..add(MailDeliveryDtoStatusEnum.serializer)
      ..add(MailPreviewDto.serializer)
      ..add(MailTemplateDto.serializer)
      ..add(MfaCodeDto.serializer)
      ..add(MfaControllerConfirm201Response.serializer)
      ..add(MfaControllerGetStatus200Response.serializer)
      ..add(MfaControllerSetup201Response.serializer)
      ..add(MfaRecoveryCodesResponseDto.serializer)
      ..add(MfaSetupResponseDto.serializer)
      ..add(MfaStatusDto.serializer)
      ..add(NotificationDto.serializer)
      ..add(NotificationJobDto.serializer)
      ..add(NotificationJobDtoAudienceEnum.serializer)
      ..add(NotificationJobDtoStatusEnum.serializer)
      ..add(NotificationsControllerList200Response.serializer)
      ..add(NotificationsControllerMarkRead200Response.serializer)
      ..add(NotificationsControllerRegisterDevice201Response.serializer)
      ..add(NotificationsControllerUnreadCount200Response.serializer)
      ..add(OrganizationDetailDto.serializer)
      ..add(OrganizationDetailDtoRoleEnum.serializer)
      ..add(OrganizationDto.serializer)
      ..add(OrganizationDtoRoleEnum.serializer)
      ..add(OrganizationMemberDto.serializer)
      ..add(OrganizationMemberDtoRoleEnum.serializer)
      ..add(OrganizationsControllerCreate200Response.serializer)
      ..add(OrganizationsControllerGetOne200Response.serializer)
      ..add(OrganizationsControllerList200Response.serializer)
      ..add(OrganizationsControllerListMembers200Response.serializer)
      ..add(OrganizationsControllerUpdateMemberRole200Response.serializer)
      ..add(PaginationMetaDto.serializer)
      ..add(PermissionDto.serializer)
      ..add(PermissionDtoScopeEnum.serializer)
      ..add(PreferencesControllerGetMyPreferences200Response.serializer)
      ..add(RefreshTokenDto.serializer)
      ..add(RegisterDeviceDto.serializer)
      ..add(RegisterDeviceDtoPlatformEnum.serializer)
      ..add(RegisterDto.serializer)
      ..add(ReplaceRolePermissionsDto.serializer)
      ..add(ReplaceUserRolesDto.serializer)
      ..add(RequestMetaDto.serializer)
      ..add(ResendVerificationDto.serializer)
      ..add(ResetPasswordDto.serializer)
      ..add(RoleAssignmentDto.serializer)
      ..add(RoleDto.serializer)
      ..add(RoleDtoScopeEnum.serializer)
      ..add(SendAdminMailDto.serializer)
      ..add(SendAdminMailResultDto.serializer)
      ..add(SendAdminMailResultDtoStatusEnum.serializer)
      ..add(SendNotificationRequestDto.serializer)
      ..add(SendNotificationRequestDtoAudienceEnum.serializer)
      ..add(SsoCallbackQueryDto.serializer)
      ..add(SsoControllerStartLogin200Response.serializer)
      ..add(StartSsoLoginResponseDto.serializer)
      ..add(SuccessFlagDto.serializer)
      ..add(SuccessMessageDto.serializer)
      ..add(SwitchOrganizationDto.serializer)
      ..add(SwitchOrganizationResponseDto.serializer)
      ..add(UpdateAdminUserDto.serializer)
      ..add(UpdateMemberRoleDto.serializer)
      ..add(UpdateMemberRoleDtoRoleEnum.serializer)
      ..add(UpdateOrganizationDto.serializer)
      ..add(UpdatePreferencesDto.serializer)
      ..add(UpdatePreferencesDtoLanguageEnum.serializer)
      ..add(UpdatePreferencesDtoThemeEnum.serializer)
      ..add(UpdateProfileDto.serializer)
      ..add(UpdateRoleDto.serializer)
      ..add(UpdateSettingDto.serializer)
      ..add(UpdateUserStatusDto.serializer)
      ..add(UpdateUserStatusDtoStatusEnum.serializer)
      ..add(UserDto.serializer)
      ..add(UserDtoStatusEnum.serializer)
      ..add(UserPreferencesDto.serializer)
      ..add(UserPreferencesDtoLanguageEnum.serializer)
      ..add(UserPreferencesDtoThemeEnum.serializer)
      ..add(VerifyEmailDto.serializer)
      ..add(VerifyMfaChallengeDto.serializer)
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(ActivityDto)]),
        () => ListBuilder<ActivityDto>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [
          const FullType(ApplicationSettingDto),
        ]),
        () => ListBuilder<ApplicationSettingDto>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(AttachmentDto)]),
        () => ListBuilder<AttachmentDto>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(AuditLogDto)]),
        () => ListBuilder<AuditLogDto>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(AuthSessionDto)]),
        () => ListBuilder<AuthSessionDto>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [
          const FullType(BatchDeleteResultItemDto),
        ]),
        () => ListBuilder<BatchDeleteResultItemDto>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(FileDto)]),
        () => ListBuilder<FileDto>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [
          const FullType(FileHistoryEventDto),
        ]),
        () => ListBuilder<FileHistoryEventDto>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(FileVersionDto)]),
        () => ListBuilder<FileVersionDto>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(JobDependencyDto)]),
        () => ListBuilder<JobDependencyDto>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(JobEventDto)]),
        () => ListBuilder<JobEventDto>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(JobListDto)]),
        () => ListBuilder<JobListDto>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [
          const FullType(JobStatusCountDto),
        ]),
        () => ListBuilder<JobStatusCountDto>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(JobTypeCountDto)]),
        () => ListBuilder<JobTypeCountDto>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(JsonObject)]),
        () => ListBuilder<JsonObject>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(MailDeliveryDto)]),
        () => ListBuilder<MailDeliveryDto>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(MailTemplateDto)]),
        () => ListBuilder<MailTemplateDto>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(NotificationDto)]),
        () => ListBuilder<NotificationDto>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [
          const FullType(NotificationJobDto),
        ]),
        () => ListBuilder<NotificationJobDto>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(OrganizationDto)]),
        () => ListBuilder<OrganizationDto>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [
          const FullType(OrganizationMemberDto),
        ]),
        () => ListBuilder<OrganizationMemberDto>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(PermissionDto)]),
        () => ListBuilder<PermissionDto>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(PermissionDto)]),
        () => ListBuilder<PermissionDto>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(RoleDto)]),
        () => ListBuilder<RoleDto>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(String)]),
        () => ListBuilder<String>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(String)]),
        () => ListBuilder<String>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(String)]),
        () => ListBuilder<String>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(String)]),
        () => ListBuilder<String>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(String)]),
        () => ListBuilder<String>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(String)]),
        () => ListBuilder<String>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(String)]),
        () => ListBuilder<String>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(String)]),
        () => ListBuilder<String>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(String)]),
        () => ListBuilder<String>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(String)]),
        () => ListBuilder<String>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(String)]),
        () => ListBuilder<String>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(String)]),
        () => ListBuilder<String>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(String)]),
        () => ListBuilder<String>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [
          const FullType(RoleAssignmentDto),
        ]),
        () => ListBuilder<RoleAssignmentDto>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(String)]),
        () => ListBuilder<String>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(String)]),
        () => ListBuilder<String>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltMap, const [
          const FullType(String),
          const FullType.nullable(JsonObject),
        ]),
        () => MapBuilder<String, JsonObject?>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(String)]),
        () => ListBuilder<String>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltMap, const [
          const FullType(String),
          const FullType.nullable(JsonObject),
        ]),
        () => MapBuilder<String, JsonObject?>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, const [const FullType(UserDto)]),
        () => ListBuilder<UserDto>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltMap, const [
          const FullType(String),
          const FullType(String),
        ]),
        () => MapBuilder<String, String>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltMap, const [
          const FullType(String),
          const FullType.nullable(JsonObject),
        ]),
        () => MapBuilder<String, JsonObject?>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltMap, const [
          const FullType(String),
          const FullType.nullable(JsonObject),
        ]),
        () => MapBuilder<String, JsonObject?>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltMap, const [
          const FullType(String),
          const FullType.nullable(JsonObject),
        ]),
        () => MapBuilder<String, JsonObject?>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltMap, const [
          const FullType(String),
          const FullType.nullable(JsonObject),
        ]),
        () => MapBuilder<String, JsonObject?>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltMap, const [
          const FullType(String),
          const FullType.nullable(JsonObject),
        ]),
        () => MapBuilder<String, JsonObject?>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltMap, const [
          const FullType(String),
          const FullType.nullable(JsonObject),
        ]),
        () => MapBuilder<String, JsonObject?>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltMap, const [
          const FullType(String),
          const FullType.nullable(JsonObject),
        ]),
        () => MapBuilder<String, JsonObject?>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltMap, const [
          const FullType(String),
          const FullType.nullable(JsonObject),
        ]),
        () => MapBuilder<String, JsonObject?>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltMap, const [
          const FullType(String),
          const FullType.nullable(JsonObject),
        ]),
        () => MapBuilder<String, JsonObject?>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltMap, const [
          const FullType(String),
          const FullType.nullable(JsonObject),
        ]),
        () => MapBuilder<String, JsonObject?>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltMap, const [
          const FullType(String),
          const FullType.nullable(JsonObject),
        ]),
        () => MapBuilder<String, JsonObject?>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltMap, const [
          const FullType(String),
          const FullType.nullable(JsonObject),
        ]),
        () => MapBuilder<String, JsonObject?>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltMap, const [
          const FullType(String),
          const FullType.nullable(JsonObject),
        ]),
        () => MapBuilder<String, JsonObject?>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltMap, const [
          const FullType(String),
          const FullType.nullable(JsonObject),
        ]),
        () => MapBuilder<String, JsonObject?>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltMap, const [
          const FullType(String),
          const FullType.nullable(JsonObject),
        ]),
        () => MapBuilder<String, JsonObject?>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltMap, const [
          const FullType(String),
          const FullType.nullable(JsonObject),
        ]),
        () => MapBuilder<String, JsonObject?>(),
      ))
    .build();

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
