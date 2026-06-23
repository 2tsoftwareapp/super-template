import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/push/push_notification_service.dart';
import 'package:mobile_app/features/auth/data/auth_repository.dart';
import 'package:mobile_app/features/auth/domain/auth_session.dart';

final authControllerProvider =
    AsyncNotifierProvider<AuthController, AuthSession?>(AuthController.new);

class AuthController extends AsyncNotifier<AuthSession?> {
  @override
  Future<AuthSession?> build() async {
    try {
      return await ref.read(authRepositoryProvider).restoreSession();
    } catch (_) {
      return null;
    }
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(authRepositoryProvider).login(email, password),
    );
  }

  Future<AuthSession> verifyMfaChallenge({
    required String mfaToken,
    required String code,
  }) async {
    final session = await ref
        .read(authRepositoryProvider)
        .verifyMfaChallenge(mfaToken: mfaToken, code: code);
    state = AsyncData(session);
    return session;
  }

  Future<void> register(
    String email,
    String password,
    String displayName,
  ) async {
    await ref
        .read(authRepositoryProvider)
        .register(email: email, password: password, displayName: displayName);
  }

  Future<void> forgotPassword(String email) {
    return ref.read(authRepositoryProvider).forgotPassword(email);
  }

  Future<void> verifyEmail(String token) {
    return ref.read(authRepositoryProvider).verifyEmail(token);
  }

  Future<void> resendVerification(String email) {
    return ref.read(authRepositoryProvider).resendVerification(email);
  }

  Future<void> resetPassword({
    required String token,
    required String newPassword,
  }) {
    return ref
        .read(authRepositoryProvider)
        .resetPassword(token: token, newPassword: newPassword);
  }

  Future<void> switchOrganization(String organizationId) async {
    await ref.read(authRepositoryProvider).switchOrganization(organizationId);
    await refreshSession();
  }

  Future<void> refreshSession() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(authRepositoryProvider).restoreSession(),
    );
  }

  /// Clears auth state without making a network call.
  /// Called by AuthInterceptor when token refresh fails.
  void invalidate() {
    state = const AsyncData(null);
  }

  Future<void> logout() async {
    await ref.read(pushNotificationServiceProvider).unregisterDevice();
    await ref.read(authRepositoryProvider).logout();
    state = const AsyncData(null);
  }

  Future<void> logoutAll() async {
    await ref.read(authRepositoryProvider).logoutAll();
    state = const AsyncData(null);
  }
}
