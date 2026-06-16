import 'package:flutter_riverpod/flutter_riverpod.dart';
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

  /// Clears auth state without making a network call.
  /// Called by AuthInterceptor when token refresh fails.
  void invalidate() {
    state = const AsyncData(null);
  }

  Future<void> logout() async {
    await ref.read(authRepositoryProvider).logout();
    state = const AsyncData(null);
  }
}
