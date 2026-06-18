//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// @dart=3.0

import 'package:dio/dio.dart';
import 'package:built_value/serializer.dart';
import 'package:super_template_api/src/serializers.dart';
import 'package:super_template_api/src/auth/api_key_auth.dart';
import 'package:super_template_api/src/auth/basic_auth.dart';
import 'package:super_template_api/src/auth/bearer_auth.dart';
import 'package:super_template_api/src/auth/oauth.dart';
import 'package:super_template_api/src/api/activities_api.dart';
import 'package:super_template_api/src/api/admin_audit_api.dart';
import 'package:super_template_api/src/api/admin_jobs_api.dart';
import 'package:super_template_api/src/api/admin_mail_api.dart';
import 'package:super_template_api/src/api/admin_notifications_api.dart';
import 'package:super_template_api/src/api/admin_roles_api.dart';
import 'package:super_template_api/src/api/admin_settings_api.dart';
import 'package:super_template_api/src/api/admin_users_api.dart';
import 'package:super_template_api/src/api/attachments_api.dart';
import 'package:super_template_api/src/api/auth_api.dart';
import 'package:super_template_api/src/api/comments_api.dart';
import 'package:super_template_api/src/api/exports_api.dart';
import 'package:super_template_api/src/api/files_api.dart';
import 'package:super_template_api/src/api/health_api.dart';
import 'package:super_template_api/src/api/imports_api.dart';
import 'package:super_template_api/src/api/invitations_api.dart';
import 'package:super_template_api/src/api/notifications_api.dart';
import 'package:super_template_api/src/api/organizations_api.dart';
import 'package:super_template_api/src/api/projects_api.dart';
import 'package:super_template_api/src/api/users_api.dart';

class SuperTemplateApi {
  static const String basePath = r'http://localhost';

  final Dio dio;
  final Serializers serializers;

  SuperTemplateApi({
    Dio? dio,
    Serializers? serializers,
    String? basePathOverride,
    List<Interceptor>? interceptors,
  })  : this.serializers = serializers ?? standardSerializers,
        this.dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: basePathOverride ?? basePath,
                connectTimeout: const Duration(milliseconds: 5000),
                receiveTimeout: const Duration(milliseconds: 3000),
              ),
            ) {
    if (interceptors == null) {
      this.dio.interceptors.addAll([
        OAuthInterceptor(),
        BasicAuthInterceptor(),
        BearerAuthInterceptor(),
        ApiKeyAuthInterceptor(),
      ]);
    } else {
      this.dio.interceptors.addAll(interceptors);
    }
  }

  void setOAuthToken(String name, String token) {
    if (this.dio.interceptors.any((i) => i is OAuthInterceptor)) {
      (this.dio.interceptors.firstWhere((i) => i is OAuthInterceptor)
              as OAuthInterceptor)
          .tokens[name] = token;
    }
  }

  void setBearerAuth(String name, String token) {
    if (this.dio.interceptors.any((i) => i is BearerAuthInterceptor)) {
      (this.dio.interceptors.firstWhere((i) => i is BearerAuthInterceptor)
              as BearerAuthInterceptor)
          .tokens[name] = token;
    }
  }

  void setBasicAuth(String name, String username, String password) {
    if (this.dio.interceptors.any((i) => i is BasicAuthInterceptor)) {
      (this.dio.interceptors.firstWhere((i) => i is BasicAuthInterceptor)
              as BasicAuthInterceptor)
          .authInfo[name] = BasicAuthInfo(
        username,
        password,
      );
    }
  }

  void setApiKey(String name, String apiKey) {
    if (this.dio.interceptors.any((i) => i is ApiKeyAuthInterceptor)) {
      (this.dio.interceptors.firstWhere(
                (element) => element is ApiKeyAuthInterceptor,
              ) as ApiKeyAuthInterceptor)
          .apiKeys[name] = apiKey;
    }
  }

  /// Get ActivitiesApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  ActivitiesApi getActivitiesApi() {
    return ActivitiesApi(dio, serializers);
  }

  /// Get AdminAuditApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  AdminAuditApi getAdminAuditApi() {
    return AdminAuditApi(dio, serializers);
  }

  /// Get AdminJobsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  AdminJobsApi getAdminJobsApi() {
    return AdminJobsApi(dio, serializers);
  }

  /// Get AdminMailApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  AdminMailApi getAdminMailApi() {
    return AdminMailApi(dio, serializers);
  }

  /// Get AdminNotificationsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  AdminNotificationsApi getAdminNotificationsApi() {
    return AdminNotificationsApi(dio, serializers);
  }

  /// Get AdminRolesApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  AdminRolesApi getAdminRolesApi() {
    return AdminRolesApi(dio, serializers);
  }

  /// Get AdminSettingsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  AdminSettingsApi getAdminSettingsApi() {
    return AdminSettingsApi(dio, serializers);
  }

  /// Get AdminUsersApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  AdminUsersApi getAdminUsersApi() {
    return AdminUsersApi(dio, serializers);
  }

  /// Get AttachmentsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  AttachmentsApi getAttachmentsApi() {
    return AttachmentsApi(dio, serializers);
  }

  /// Get AuthApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  AuthApi getAuthApi() {
    return AuthApi(dio, serializers);
  }

  /// Get CommentsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  CommentsApi getCommentsApi() {
    return CommentsApi(dio, serializers);
  }

  /// Get ExportsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  ExportsApi getExportsApi() {
    return ExportsApi(dio, serializers);
  }

  /// Get FilesApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  FilesApi getFilesApi() {
    return FilesApi(dio, serializers);
  }

  /// Get HealthApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  HealthApi getHealthApi() {
    return HealthApi(dio, serializers);
  }

  /// Get ImportsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  ImportsApi getImportsApi() {
    return ImportsApi(dio, serializers);
  }

  /// Get InvitationsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  InvitationsApi getInvitationsApi() {
    return InvitationsApi(dio, serializers);
  }

  /// Get NotificationsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  NotificationsApi getNotificationsApi() {
    return NotificationsApi(dio, serializers);
  }

  /// Get OrganizationsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  OrganizationsApi getOrganizationsApi() {
    return OrganizationsApi(dio, serializers);
  }

  /// Get ProjectsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  ProjectsApi getProjectsApi() {
    return ProjectsApi(dio, serializers);
  }

  /// Get UsersApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  UsersApi getUsersApi() {
    return UsersApi(dio, serializers);
  }
}
