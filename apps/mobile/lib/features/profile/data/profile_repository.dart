import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/errors/app_exception.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:super_template_api/super_template_api.dart';

final profileRepositoryProvider = Provider<ProfileRepository>(
  (ref) => ProfileRepository(ref.watch(apiClientProvider)),
);

class ProfileRepository {
  ProfileRepository(this._client);

  final SuperTemplateApi _client;

  UsersApi get _usersApi => _client.getUsersApi();
  AuthApi get _authApi => _client.getAuthApi();

  Future<void> updateProfile({
    required String displayName,
    String? avatarUrl,
  }) async {
    try {
      await _usersApi.usersControllerUpdateMe(
        updateProfileDto: UpdateProfileDto(
          (b) => b
            ..displayName = displayName
            ..avatarUrl = avatarUrl == null ? null : JsonObject(avatarUrl),
        ),
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      await _usersApi.usersControllerChangePassword(
        changePasswordDto: ChangePasswordDto(
          (b) => b
            ..currentPassword = currentPassword
            ..newPassword = newPassword,
        ),
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<BuiltList<AuthSessionDto>> sessions() async {
    try {
      final response = await _authApi.authSessionControllerGetSessions();
      return response.data!.data;
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }
}
