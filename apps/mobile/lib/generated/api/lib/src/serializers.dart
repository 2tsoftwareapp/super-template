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

import 'package:super_template_api/src/model/admin_users_controller_create_user201_response.dart';
import 'package:super_template_api/src/model/admin_users_controller_delete_user200_response.dart';
import 'package:super_template_api/src/model/admin_users_controller_list_users200_response.dart';
import 'package:super_template_api/src/model/auth_controller_get_me200_response.dart';
import 'package:super_template_api/src/model/auth_controller_get_sessions200_response.dart';
import 'package:super_template_api/src/model/auth_controller_login201_response.dart';
import 'package:super_template_api/src/model/auth_controller_register201_response.dart';
import 'package:super_template_api/src/model/auth_me_dto.dart';
import 'package:super_template_api/src/model/auth_response_dto.dart';
import 'package:super_template_api/src/model/auth_session_dto.dart';
import 'package:super_template_api/src/model/change_password_dto.dart';
import 'package:super_template_api/src/model/count_dto.dart';
import 'package:super_template_api/src/model/create_admin_user_dto.dart';
import 'package:super_template_api/src/model/create_project_dto.dart';
import 'package:super_template_api/src/model/forgot_password_dto.dart';
import 'package:super_template_api/src/model/health_controller_get_health200_response.dart';
import 'package:super_template_api/src/model/health_status_dto.dart';
import 'package:super_template_api/src/model/login_dto.dart';
import 'package:super_template_api/src/model/notification_dto.dart';
import 'package:super_template_api/src/model/notifications_controller_list200_response.dart';
import 'package:super_template_api/src/model/notifications_controller_mark_read200_response.dart';
import 'package:super_template_api/src/model/notifications_controller_unread_count200_response.dart';
import 'package:super_template_api/src/model/pagination_meta_dto.dart';
import 'package:super_template_api/src/model/project_dto.dart';
import 'package:super_template_api/src/model/projects_controller_create201_response.dart';
import 'package:super_template_api/src/model/projects_controller_list200_response.dart';
import 'package:super_template_api/src/model/refresh_token_dto.dart';
import 'package:super_template_api/src/model/register_dto.dart';
import 'package:super_template_api/src/model/replace_user_roles_dto.dart';
import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/resend_verification_dto.dart';
import 'package:super_template_api/src/model/reset_password_dto.dart';
import 'package:super_template_api/src/model/send_notification_dto.dart';
import 'package:super_template_api/src/model/success_flag_dto.dart';
import 'package:super_template_api/src/model/success_message_dto.dart';
import 'package:super_template_api/src/model/update_admin_user_dto.dart';
import 'package:super_template_api/src/model/update_profile_dto.dart';
import 'package:super_template_api/src/model/update_project_dto.dart';
import 'package:super_template_api/src/model/update_user_status_dto.dart';
import 'package:super_template_api/src/model/user_dto.dart';
import 'package:super_template_api/src/model/verify_email_dto.dart';

part 'serializers.g.dart';

@SerializersFor([
  AdminUsersControllerCreateUser201Response,
  AdminUsersControllerDeleteUser200Response,
  AdminUsersControllerListUsers200Response,
  AuthControllerGetMe200Response,
  AuthControllerGetSessions200Response,
  AuthControllerLogin201Response,
  AuthControllerRegister201Response,
  AuthMeDto,
  AuthResponseDto,
  AuthSessionDto,
  ChangePasswordDto,
  CountDto,
  CreateAdminUserDto,
  CreateProjectDto,
  ForgotPasswordDto,
  HealthControllerGetHealth200Response,
  HealthStatusDto,
  LoginDto,
  NotificationDto,
  NotificationsControllerList200Response,
  NotificationsControllerMarkRead200Response,
  NotificationsControllerUnreadCount200Response,
  PaginationMetaDto,
  ProjectDto,
  ProjectsControllerCreate201Response,
  ProjectsControllerList200Response,
  RefreshTokenDto,
  RegisterDto,
  ReplaceUserRolesDto,
  RequestMetaDto,
  ResendVerificationDto,
  ResetPasswordDto,
  SendNotificationDto,
  SuccessFlagDto,
  SuccessMessageDto,
  UpdateAdminUserDto,
  UpdateProfileDto,
  UpdateProjectDto,
  UpdateUserStatusDto,
  UserDto,
  VerifyEmailDto,
])
Serializers serializers = (_$serializers.toBuilder()
      ..add(const OneOfSerializer())
      ..add(const AnyOfSerializer())
      ..add(const DateSerializer())
      ..add(Iso8601DateTimeSerializer()))
    .build();

Serializers standardSerializers =
    (serializers.toBuilder()..addPlugin(StandardJsonPlugin())).build();
