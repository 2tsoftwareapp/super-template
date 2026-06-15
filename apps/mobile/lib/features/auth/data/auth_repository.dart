import 'package:built_collection/built_collection.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/auth/token_bundle.dart';
import 'package:mobile_app/core/auth/token_storage.dart';
import 'package:mobile_app/core/errors/app_exception.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:mobile_app/features/auth/domain/auth_session.dart';
import 'package:super_template_api/super_template_api.dart';

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(
    ref.watch(apiClientProvider),
    ref.watch(tokenStorageProvider),
  ),
);

class AuthRepository {
  AuthRepository(this._client, this._storage);

  final SuperTemplateApi _client;
  final TokenStorage _storage;

  AuthApi get _authApi => _client.getAuthApi();

  Future<AuthSession?> restoreSession() async {
    final tokens = await _storage.read();
    if (tokens == null) {
      return null;
    }
    try {
      final response = await _authApi.authControllerGetMe();
      return _toSession(response.data!.data);
    } on DioException catch (error) {
      await _storage.clear();
      throw AppException.fromDio(error);
    }
  }

  Future<AuthSession> login(String email, String password) async {
    try {
      final response = await _authApi.authControllerLogin(
        loginDto: LoginDto(
          (b) => b
            ..email = email
            ..password = password,
        ),
      );
      final data = response.data!.data;
      await _storage.write(
        TokenBundle(
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        ),
      );
      return _toAuthResponse(data);
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> register({
    required String email,
    required String password,
    required String displayName,
  }) async {
    try {
      await _authApi.authControllerRegister(
        registerDto: RegisterDto(
          (b) => b
            ..email = email
            ..password = password
            ..displayName = displayName,
        ),
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> forgotPassword(String email) async {
    try {
      await _authApi.authControllerForgotPassword(
        forgotPasswordDto: ForgotPasswordDto((b) => b..email = email),
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<TokenBundle?> refresh() async {
    final tokens = await _storage.read();
    if (tokens == null) {
      return null;
    }
    try {
      final response = await _authApi.authControllerRefresh(
        refreshTokenDto: RefreshTokenDto(
          (b) => b..refreshToken = tokens.refreshToken,
        ),
      );
      final refreshed = TokenBundle(
        accessToken: response.data!.data.accessToken,
        refreshToken: response.data!.data.refreshToken,
      );
      await _storage.write(refreshed);
      return refreshed;
    } on DioException catch (error) {
      await _storage.clear();
      throw AppException.fromDio(error);
    }
  }

  Future<void> logout() async {
    try {
      await _authApi.authControllerLogout();
    } on DioException {
      // Local logout must still clear the secure store even if the API is unavailable.
    } finally {
      await _storage.clear();
    }
  }

  Future<BuiltList<AuthSessionDto>> sessions() async {
    try {
      final response = await _authApi.authControllerGetSessions();
      return response.data!.data;
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> revokeSession(String sessionId) async {
    try {
      await _authApi.authControllerRevokeSession(sessionId: sessionId);
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  AuthSession _toAuthResponse(AuthResponseDto data) {
    return AuthSession(
      userId: data.user.id,
      email: data.user.email,
      displayName: data.user.displayName,
      roles: data.user.roles.toList(),
      permissions: data.permissions.toList(),
      sessionId: data.session.id,
    );
  }

  AuthSession _toSession(AuthMeDto data) {
    return AuthSession(
      userId: data.user.id,
      email: data.user.email,
      displayName: data.user.displayName,
      roles: data.user.roles.toList(),
      permissions: data.permissions.toList(),
      sessionId: data.sessionId,
    );
  }
}
