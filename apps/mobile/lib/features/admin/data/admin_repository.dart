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

class AdminRepository {
  AdminRepository(this._client);

  final SuperTemplateApi _client;

  AdminUsersApi get _usersApi => _client.getAdminUsersApi();

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
      final response = await _client.dio.get<Map<String, dynamic>>(
        '/api/v1/admin/roles',
      );
      final data = response.data?['data'] as List<dynamic>? ?? [];
      return data
          .map(
            (item) => AdminRole(
              id: item['id'] as String,
              name: item['name'] as String,
              description: item['description'] as String,
            ),
          )
          .toList();
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<List<AuditLogSummary>> listAuditLogs() async {
    try {
      final response = await _client.dio.get<Map<String, dynamic>>(
        '/api/v1/admin/audit-logs',
      );
      final data = response.data?['data'] as List<dynamic>? ?? [];
      return data
          .map(
            (item) => AuditLogSummary(
              id: item['id'] as String,
              action: item['action'] as String,
              entityType: item['entityType'] as String,
              entityId: item['entityId'] as String?,
              actorId: item['actorId'] as String?,
              createdAt: DateTime.parse(item['createdAt'] as String),
            ),
          )
          .toList();
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }
}
