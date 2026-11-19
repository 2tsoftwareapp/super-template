import 'package:feature_identity/feature_identity.dart';
import 'package:feature_platform/feature_platform.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/app/redirect_policy.dart';
import 'package:mobile_app/app/shell_scaffold.dart';
import 'package:mobile_app/features/auth/presentation/auth_controller.dart';
import 'package:mobile_app/features/auth/presentation/screens/forgot_password_screen.dart';
import 'package:mobile_app/features/auth/presentation/screens/login_screen.dart';
import 'package:mobile_app/features/auth/presentation/screens/register_screen.dart';
import 'package:mobile_app/features/auth/presentation/screens/reset_password_screen.dart';
import 'package:mobile_app/features/auth/presentation/screens/splash_screen.dart';
import 'package:mobile_app/features/auth/presentation/screens/verify_email_screen.dart';
import 'package:mobile_app/features/exports/presentation/exports_screen.dart';
import 'package:mobile_app/features/gallery/presentation/gallery_screen.dart';
import 'package:mobile_app/features/home/presentation/home_screen.dart';
import 'package:mobile_app/features/imports/presentation/imports_screen.dart';
import 'package:mobile_app/features/notifications/presentation/notifications_screen.dart';
import 'package:mobile_app/features/organizations/presentation/organization_detail_screen.dart';
import 'package:mobile_app/features/organizations/presentation/organizations_screen.dart';
import 'package:mobile_app/features/profile/presentation/preferences_screen.dart';
import 'package:mobile_app/features/profile/presentation/profile_screen.dart';
import 'package:mobile_app/features/profile/presentation/security_screen.dart';
import 'package:mobile_app/features/profile/presentation/sessions_screen.dart';

final rootNavigatorKey = GlobalKey<NavigatorState>();
final _homeNavKey = GlobalKey<NavigatorState>(debugLabel: 'home');
final _notifNavKey = GlobalKey<NavigatorState>(debugLabel: 'notif');
final _galleryNavKey = GlobalKey<NavigatorState>(debugLabel: 'gallery');
final _profileNavKey = GlobalKey<NavigatorState>(debugLabel: 'profile');

final appRouterProvider = Provider<GoRouter>((ref) {
  // Watching the auth state here rebuilt the router (and its navigator keys)
  // on every auth emission. Build it once and let `refreshListenable` re-run
  // `redirect` when the auth state changes instead.
  final authRefresh = _AuthRefreshListenable(ref);
  ref.onDispose(authRefresh.dispose);

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: IdentityRoutes.splash,
    refreshListenable: authRefresh,
    redirect: (context, state) {
      final authState = ref.read(authControllerProvider);
      return resolveRedirect(
        isAuthenticated: authState.valueOrNull?.isAuthenticated ?? false,
        isLoading: authState.isLoading,
        hasError: authState.hasError,
        location: state.matchedLocation,
      );
    },
    routes: [
      GoRoute(
        path: IdentityRoutes.splash,
        builder: (_, _) => const SplashScreen(),
      ),
      GoRoute(
        path: IdentityRoutes.login,
        builder: (_, _) => const LoginScreen(),
      ),
      GoRoute(
        path: IdentityRoutes.register,
        builder: (_, _) => const RegisterScreen(),
      ),
      GoRoute(
        path: IdentityRoutes.forgotPassword,
        builder: (_, _) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: IdentityRoutes.verifyEmail,
        builder: (_, state) =>
            VerifyEmailScreen(initialToken: state.uri.queryParameters['token']),
      ),
      GoRoute(
        path: IdentityRoutes.resetPassword,
        builder: (_, state) => ResetPasswordScreen(
          initialToken: state.uri.queryParameters['token'],
        ),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: IdentityRoutes.organizationDetail,
        builder: (_, state) => OrganizationDetailScreen(
          organizationId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: IdentityRoutes.preferences,
        builder: (_, _) => const PreferencesScreen(),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: IdentityRoutes.security,
        builder: (_, _) => const SecurityScreen(),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: IdentityRoutes.sessions,
        builder: (_, _) => const SessionsScreen(),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: IdentityRoutes.organizations,
        builder: (_, _) => const OrganizationsScreen(),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: PlatformRoutes.imports,
        builder: (_, _) => const ImportsScreen(),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: PlatformRoutes.exports,
        builder: (_, _) => const ExportsScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (_, _, navigationShell) =>
            ShellScaffold(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            navigatorKey: _homeNavKey,
            routes: [
              GoRoute(path: '/home', builder: (_, _) => const HomeScreen()),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _notifNavKey,
            routes: [
              GoRoute(
                path: PlatformRoutes.notifications,
                builder: (_, _) => const NotificationsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _galleryNavKey,
            preload: true,
            routes: [
              GoRoute(
                path: PlatformRoutes.gallery,
                builder: (_, _) => const GalleryScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _profileNavKey,
            routes: [
              GoRoute(
                path: '/profile',
                builder: (_, _) => const ProfileScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});

/// Bridges Riverpod auth-state changes to [GoRouter]'s `refreshListenable`.
class _AuthRefreshListenable extends ChangeNotifier {
  _AuthRefreshListenable(Ref ref) {
    ref.listen(authControllerProvider, (_, _) => notifyListeners());
  }
}
