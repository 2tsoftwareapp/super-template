import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
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

const _publicRoutes = {
  '/splash',
  '/login',
  '/register',
  '/forgot-password',
  '/verify-email',
  '/reset-password',
};

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authControllerProvider);

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/splash',
    redirect: (context, state) {
      final isAuthed = authState.valueOrNull?.isAuthenticated ?? false;
      final isLoading = authState.isLoading;
      final location = state.matchedLocation;
      final isPublic = _publicRoutes.contains(location);

      if (isLoading) {
        return location == '/splash' ? null : '/splash';
      }

      if (!isAuthed) {
        if (location == '/splash') return '/login';
        if (isPublic) return null;
        return '/login';
      }

      if (location == '/splash' || isPublic) return '/home';

      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, _) => const SplashScreen()),
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, _) => const RegisterScreen()),
      GoRoute(
        path: '/forgot-password',
        builder: (_, _) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/verify-email',
        builder: (_, state) =>
            VerifyEmailScreen(initialToken: state.uri.queryParameters['token']),
      ),
      GoRoute(
        path: '/reset-password',
        builder: (_, state) => ResetPasswordScreen(
          initialToken: state.uri.queryParameters['token'],
        ),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/organizations/:id',
        builder: (_, state) => OrganizationDetailScreen(
          organizationId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/preferences',
        builder: (_, _) => const PreferencesScreen(),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/security',
        builder: (_, _) => const SecurityScreen(),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/sessions',
        builder: (_, _) => const SessionsScreen(),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/organizations',
        builder: (_, _) => const OrganizationsScreen(),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/imports',
        builder: (_, _) => const ImportsScreen(),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/exports',
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
                path: '/notifications',
                builder: (_, _) => const NotificationsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _galleryNavKey,
            preload: true,
            routes: [
              GoRoute(
                path: '/gallery',
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
