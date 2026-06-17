import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/errors/app_exception.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:super_template_api/super_template_api.dart';

final adminRepositoryProvider = Provider<AdminRepository>(
  (ref) => AdminRepository(ref.watch(apiClientProvider)),
);

class AdminUserSummary {
  const AdminUserSummary({
    required this.id,
    required this.email,
    required this.displayName,
    required this.status,
    required this.roles,
  });

  final String id;
  final String email;
  final String displayName;
  final String status;
  final List<String> roles;
}

class AuditLogSummary {
  const AuditLogSummary({
    required this.id,
    required this.action,
    required this.entityType,
    required this.entityId,
    required this.actorId,
    required this.createdAt,
  });

  final String id;
  final String action;
  final String entityType;
  final String? entityId;
  final String? actorId;
  final DateTime createdAt;
}

class AdminRole {
  const AdminRole({
    required this.id,
    required this.name,
    required this.description,
  });

  final String id;
  final String name;
  final String description;
}

class AdminMailDelivery {
  const AdminMailDelivery({
    required this.id,
    required this.templateKey,
    required this.recipient,
    required this.subject,
    required this.status,
    required this.createdAt,
  });

  final String id;
  final String templateKey;
  final String recipient;
  final String subject;
  final String status;
  final String createdAt;
}

class AdminSetting {
  const AdminSetting({
    required this.key,
    required this.valueJson,
    required this.updatedAt,
  });

  final String key;
  final String valueJson;
  final String updatedAt;
}

class AdminJobSummary {
  const AdminJobSummary({
    required this.id,
    required this.type,
    required this.status,
    required this.createdAt,
  });

  final String id;
  final String type;
  final String status;
  final String createdAt;
}

class AdminNotificationJobSummary {
  const AdminNotificationJobSummary({
    required this.id,
    required this.title,
    required this.audience,
    required this.status,
    required this.scheduledAt,
  });

  final String id;
  final String title;
  final String audience;
  final String status;
  final String scheduledAt;
}

class AdminRepository {
  AdminRepository(this._client);

  final SuperTemplateApi _client;

  AdminUsersApi get _usersApi => _client.getAdminUsersApi();
  AdminRolesApi get _rolesApi => _client.getAdminRolesApi();
  AdminJobsApi get _jobsApi => _client.getAdminJobsApi();
  AdminMailApi get _mailApi => _client.getAdminMailApi();
  AdminSettingsApi get _settingsApi => _client.getAdminSettingsApi();
  AdminNotificationsApi get _notificationsApi =>
      _client.getAdminNotificationsApi();
  AdminAuditApi get _auditApi => _client.getAdminAuditApi();

  Future<List<AdminUserSummary>> listUsers() async {
    try {
      final response = await _usersApi.adminUsersControllerListUsers();
      return response.data!.data
          .map(
            (user) => AdminUserSummary(
              id: user.id,
              email: user.email,
              displayName: user.displayName,
              status: user.status.name,
              roles: user.roles.toList(),
            ),
          )
          .toList();
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<AdminUserSummary> getUser(String id) async {
    try {
      final response = await _usersApi.adminUsersControllerGetUser(id: id);
      final user = response.data!.data;
      return AdminUserSummary(
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        status: user.status.name,
        roles: user.roles.toList(),
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<AdminUserSummary> createUser({
    required String email,
    required String password,
    required String displayName,
  }) async {
    try {
      final response = await _usersApi.adminUsersControllerCreateUser(
        createAdminUserDto: CreateAdminUserDto(
          (b) => b
            ..email = email
            ..password = password
            ..displayName = displayName
            ..status = CreateAdminUserDtoStatusEnum.ACTIVE,
        ),
      );
      final user = response.data!.data;
      return AdminUserSummary(
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        status: user.status.name,
        roles: user.roles.toList(),
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<AdminUserSummary> updateStatus({
    required String id,
    required String status,
  }) async {
    try {
      final response = await _usersApi.adminUsersControllerUpdateStatus(
        id: id,
        updateUserStatusDto: UpdateUserStatusDto(
          (b) => b..status = UpdateUserStatusDtoStatusEnum.valueOf(status),
        ),
      );
      final user = response.data!.data;
      return AdminUserSummary(
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        status: user.status.name,
        roles: user.roles.toList(),
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<List<AdminRole>> listRoles() async {
    try {
      final response = await _rolesApi.adminRolesControllerListRoles();
      return response.data!.data
          .map(
            (role) => AdminRole(
              id: role.id,
              name: role.name,
              description: role.description,
            ),
          )
          .toList();
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<AdminUserSummary> updateUser({
    required String id,
    String? displayName,
    String? email,
    List<String>? roleIds,
  }) async {
    try {
      final response = await _usersApi.adminUsersControllerUpdateUser(
        id: id,
        updateAdminUserDto: UpdateAdminUserDto(
          (b) => b
            ..displayName = displayName
            ..email = email
            ..roleIds = roleIds == null ? null : ListBuilder<String>(roleIds),
        ),
      );
      final user = response.data!.data;
      return AdminUserSummary(
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        status: user.status.name,
        roles: user.roles.toList(),
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> deleteUser(String id) async {
    try {
      await _usersApi.adminUsersControllerDeleteUser(id: id);
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<AdminUserSummary> replaceRoles({
    required String id,
    required List<String> roleIds,
  }) async {
    try {
      final response = await _usersApi.adminUsersControllerReplaceRoles(
        id: id,
        replaceUserRolesDto: ReplaceUserRolesDto(
          (b) => b..roleIds.replace(roleIds),
        ),
      );
      final user = response.data!.data;
      return AdminUserSummary(
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        status: user.status.name,
        roles: user.roles.toList(),
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<List<AdminJobSummary>> listJobs() async {
    try {
      final response = await _jobsApi.adminJobsControllerListJobs();
      return response.data!.data
          .map(
            (job) => AdminJobSummary(
              id: job.id,
              type: job.type,
              status: job.status.name,
              createdAt: job.createdAt,
            ),
          )
          .toList();
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> cancelJob(String id) async {
    try {
      await _jobsApi.adminJobsControllerCancelJob(id: id);
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<List<AdminMailDelivery>> listMailDeliveries() async {
    try {
      final response = await _mailApi.adminMailControllerListDeliveries();
      return response.data!.data
          .map(
            (delivery) => AdminMailDelivery(
              id: delivery.id,
              templateKey: delivery.templateKey,
              recipient: delivery.recipient,
              subject: delivery.subject,
              status: delivery.status.name,
              createdAt: delivery.createdAt,
            ),
          )
          .toList();
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<String> previewMail(String templateKey) async {
    try {
      final response = await _mailApi.adminMailControllerPreview(
        templateKey: templateKey,
      );
      return response.data!.data.html;
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<List<AdminSetting>> listSettings() async {
    try {
      final response = await _settingsApi.adminSettingsControllerListSettings();
      return response.data!.data
          .map(
            (setting) => AdminSetting(
              key: setting.key,
              valueJson: setting.value.toString(),
              updatedAt: setting.updatedAt,
            ),
          )
          .toList();
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<AdminSetting> updateSetting({
    required String key,
    required Map<String, Object?> value,
  }) async {
    try {
      final response = await _settingsApi.adminSettingsControllerUpdateSetting(
        key: key,
        updateSettingDto: UpdateSettingDto(
          (b) => b.value.replace(
            Map<String, JsonObject?>.from(
              value.map(
                (entryKey, entryValue) => MapEntry(
                  entryKey,
                  entryValue == null ? null : JsonObject(entryValue),
                ),
              ),
            ),
          ),
        ),
      );
      final setting = response.data!.data;
      return AdminSetting(
        key: setting.key,
        valueJson: setting.value.toString(),
        updatedAt: setting.updatedAt,
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<String> sendAdminNotification({
    required SendNotificationRequestDto request,
  }) async {
    try {
      final response = await _notificationsApi.adminNotificationsControllerSend(
        sendNotificationRequestDto: request,
      );
      return response.data!.data.id;
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<List<AdminNotificationJobSummary>> listNotificationJobs() async {
    try {
      final response = await _notificationsApi
          .adminNotificationsControllerListJobs();
      return response.data!.data
          .map(
            (job) => AdminNotificationJobSummary(
              id: job.id,
              title: job.title,
              audience: job.audience.name,
              status: job.status.name,
              scheduledAt: job.scheduledAt,
            ),
          )
          .toList();
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> cancelNotificationJob(String id) async {
    try {
      await _notificationsApi.adminNotificationsControllerCancelJob(id: id);
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<List<AuditLogSummary>> listAuditLogs() async {
    try {
      final response = await _auditApi.auditControllerListAuditLogs();
      return response.data!.data
          .map(
            (item) => AuditLogSummary(
              id: item.id,
              action: item.action,
              entityType: item.entityType,
              entityId: item.entityId,
              actorId: item.actorId,
              createdAt: DateTime.parse(item.createdAt),
            ),
          )
          .toList();
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }
}
