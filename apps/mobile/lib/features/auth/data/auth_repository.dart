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
    publicClient: ref.watch(publicApiClientProvider),
    authenticatedClient: ref.watch(apiClientProvider),
    storage: ref.watch(tokenStorageProvider),
  ),
);

class AuthRepository {
  AuthRepository._(
    this._publicAuthApi,
    this._authApi,
    this._ssoApi,
    this._publicDio,
    this._authenticatedDio,
    this._storage,
  );

  factory AuthRepository({
    required SuperTemplateApi publicClient,
    required SuperTemplateApi authenticatedClient,
    required TokenStorage storage,
  }) => AuthRepository._(
    publicClient.getAuthApi(),
    authenticatedClient.getAuthApi(),
    publicClient.getSsoApi(),
    publicClient.dio,
    authenticatedClient.dio,
    storage,
  );

  final AuthApi _publicAuthApi;
  final AuthApi _authApi;
  final SsoApi _ssoApi;
  final Dio _publicDio;
  final Dio _authenticatedDio;
  final TokenStorage _storage;

  Future<AuthSession?> restoreSession() async {
    final tokens = await _storage.read();
    if (tokens == null) {
      return null;
    }
    try {
      final response = await _authApi.authSessionControllerGetMe();
      return _toSession(response.data!.data);
    } on DioException catch (error) {
      final statusCode = error.response?.statusCode;

      if (statusCode == 401) {
        // Server explicitly rejected the token — clear and go to login.
        await _storage.clear();
        return null;
      }

      // Network error / timeout / 5xx: keep tokens so the user can retry
      // after connectivity is restored. Return null to skip straight to login
      // UI without an error dialog.
      return null;
    }
  }

  Future<AuthSession> login(String email, String password) async {
    try {
      final response = await _publicAuthApi.authLoginControllerLogin(
        loginDto: LoginDto(
          (b) => b
            ..email = email
            ..password = password,
        ),
      );
      final data = response.data!.data;
      if (data.mfaRequired) {
        throw MfaRequiredException(mfaToken: data.mfaToken!);
      }
      await _storage.write(
        TokenBundle(
          accessToken: data.accessToken!,
          refreshToken: data.refreshToken!,
        ),
      );
      return _toSessionFromLogin(data);
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<AuthSession> verifyMfaChallenge({
    required String mfaToken,
    required String code,
  }) async {
    try {
      final response = await _publicAuthApi.authLoginControllerVerifyMfaChallenge(
        verifyMfaChallengeDto: VerifyMfaChallengeDto(
          (b) => b
            ..mfaToken = mfaToken
            ..code = code,
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
      await _publicAuthApi.authRegistrationControllerRegister(
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
      await _publicAuthApi.authRecoveryControllerForgotPassword(
        forgotPasswordDto: ForgotPasswordDto((b) => b..email = email),
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  /// Refreshes tokens using the public (unauthenticated) client so that the
  /// AuthInterceptor on the authenticated client is never triggered recursively.
  Future<TokenBundle?> refresh() async {
    final tokens = await _storage.read();
    if (tokens == null) {
      return null;
    }
    try {
      final response = await _publicAuthApi.authLoginControllerRefresh(
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
      if (error.response?.statusCode == 401) {
        // Refresh token rejected — must log in again.
        await _storage.clear();
      }
      // Re-throw so the auth interceptor knows refresh failed and can decide
      // what to do (it will clear tokens and invalidate auth on AppException).
      throw AppException.fromDio(error);
    }
  }

  Future<void> logout() async {
    try {
      await _authApi.authSessionControllerLogout();
    } on DioException {
      // Local logout must still clear the secure store even if the API is unavailable.
    } finally {
      await _storage.clear();
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

  Future<void> revokeSession(String sessionId) async {
    try {
      await _authApi.authSessionControllerRevokeSession(sessionId: sessionId);
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> verifyEmail(String token) async {
    try {
      await _publicAuthApi.authRegistrationControllerVerifyEmail(
        verifyEmailDto: VerifyEmailDto((b) => b..token = token),
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> resendVerification(String email) async {
    try {
      await _publicAuthApi.authRegistrationControllerResendVerification(
        resendVerificationDto: ResendVerificationDto((b) => b..email = email),
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    try {
      await _publicAuthApi.authRecoveryControllerResetPassword(
        resetPasswordDto: ResetPasswordDto(
          (b) => b
            ..token = token
            ..newPassword = newPassword,
        ),
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> logoutAll() async {
    try {
      await _authApi.authSessionControllerLogoutAll();
    } on DioException {
      // Local logout must still clear the secure store even if the API is unavailable.
    } finally {
      await _storage.clear();
    }
  }

  Future<String> startSso(String provider) async {
    try {
      final response = await _ssoApi.ssoControllerStartLogin(
        provider: provider,
        redirectUri: 'myapp://sso/callback',
      );
      return response.data!.data.authorizationUrl;
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> completeSsoExchange(String exchangeCode) async {
    try {
      final response = await _publicDio.post<Map<String, dynamic>>(
        '/api/v1/auth/sso/exchange',
        data: {'code': exchangeCode},
      );
      final accessToken = response.data?['data']?['accessToken'] as String?;
      final refreshToken = response.data?['data']?['refreshToken'] as String?;
      if (accessToken == null || refreshToken == null) {
        throw AppException('Invalid SSO exchange response');
      }
      await _storage.write(
        TokenBundle(accessToken: accessToken, refreshToken: refreshToken),
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> switchOrganization(String organizationId) async {
    try {
      final response = await _authenticatedDio.post<Map<String, dynamic>>(
        '/api/v1/auth/switch-organization',
        data: {'organizationId': organizationId},
      );
      final accessToken = response.data?['data']?['accessToken'] as String?;
      if (accessToken != null) {
        final current = await _storage.read();
        if (current != null) {
          await _storage.write(
            TokenBundle(
              accessToken: accessToken,
              refreshToken: current.refreshToken,
            ),
          );
        }
      }
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

  AuthSession _toSessionFromLogin(LoginResponseDto data) {
    return AuthSession(
      userId: data.user!.id,
      email: data.user!.email,
      displayName: data.user!.displayName,
      roles: data.user!.roles.toList(),
      permissions: data.permissions!.toList(),
      sessionId: data.session!.id,
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
