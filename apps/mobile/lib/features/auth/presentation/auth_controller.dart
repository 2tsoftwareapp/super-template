import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/push/push_notification_service.dart';
import 'package:mobile_app/features/activities/data/activities_repository.dart';
import 'package:mobile_app/features/auth/data/auth_repository.dart';
import 'package:mobile_app/features/auth/domain/auth_session.dart';
import 'package:mobile_app/features/notifications/data/notifications_repository.dart';
import 'package:mobile_app/features/organizations/data/organizations_repository.dart';
import 'package:mobile_app/features/profile/data/mfa_repository.dart';
import 'package:mobile_app/features/profile/data/preferences_repository.dart';
import 'package:mobile_app/features/profile/data/profile_repository.dart';

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
    _invalidateUserScopedProviders();
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
    _invalidateUserScopedProviders();
  }

  Future<void> logout() async {
    await ref.read(pushNotificationServiceProvider).unregisterDevice();
    await ref.read(authRepositoryProvider).logout();
    state = const AsyncData(null);
    _invalidateUserScopedProviders();
  }

  Future<void> logoutAll() async {
    await ref.read(authRepositoryProvider).logoutAll();
    state = const AsyncData(null);
    _invalidateUserScopedProviders();
  }

  void _invalidateUserScopedProviders() {
    // Identity and tenant changes make every cached repository result unsafe
    // to reuse, including dependent family providers and active sessions.
    ref
      ..invalidate(activitiesRepositoryProvider)
      ..invalidate(authRepositoryProvider)
      ..invalidate(mfaRepositoryProvider)
      ..invalidate(notificationsRepositoryProvider)
      ..invalidate(organizationsRepositoryProvider)
      ..invalidate(preferencesRepositoryProvider)
      ..invalidate(profileRepositoryProvider);
  }
}
