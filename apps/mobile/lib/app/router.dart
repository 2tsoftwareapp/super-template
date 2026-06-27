import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/app/shell_scaffold.dart';
import 'package:mobile_app/features/admin/presentation/admin_hub_screen.dart';
import 'package:mobile_app/features/admin/presentation/admin_jobs_screen.dart';
import 'package:mobile_app/features/admin/presentation/admin_mail_screen.dart';
import 'package:mobile_app/features/admin/presentation/admin_notifications_screen.dart';
import 'package:mobile_app/features/admin/presentation/admin_roles_screen.dart';
import 'package:mobile_app/features/admin/presentation/admin_settings_screen.dart';
import 'package:mobile_app/features/admin/presentation/admin_user_detail_screen.dart';
import 'package:mobile_app/features/admin/presentation/admin_users_screen.dart';
import 'package:mobile_app/features/admin/presentation/audit_logs_screen.dart';
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
import 'package:mobile_app/features/invitations/presentation/accept_invitation_screen.dart';
import 'package:mobile_app/features/notifications/presentation/notifications_screen.dart';
import 'package:mobile_app/features/organizations/presentation/organization_detail_screen.dart';
import 'package:mobile_app/features/organizations/presentation/organizations_screen.dart';
import 'package:mobile_app/features/profile/presentation/preferences_screen.dart';
import 'package:mobile_app/features/profile/presentation/profile_screen.dart';
import 'package:mobile_app/features/profile/presentation/security_screen.dart';
import 'package:mobile_app/features/profile/presentation/sessions_screen.dart';
import 'package:mobile_app/features/projects/presentation/project_detail_screen.dart';
import 'package:mobile_app/features/projects/presentation/project_editor_screen.dart';
import 'package:mobile_app/features/projects/presentation/projects_screen.dart';

final rootNavigatorKey = GlobalKey<NavigatorState>();
final _homeNavKey = GlobalKey<NavigatorState>(debugLabel: 'home');
final _projectsNavKey = GlobalKey<NavigatorState>(debugLabel: 'projects');
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
      final isInvite = location.startsWith('/invite/');

      // While auth is resolving, keep showing splash.
      if (isLoading) {
        return location == '/splash' ? null : '/splash';
      }

      if (!isAuthed) {
        // Splash is only a loading screen; once auth resolves send to login.
        if (location == '/splash') return '/login';
        // Let other public routes (login, register…) render as-is.
        if (isPublic) return null;
        if (isInvite) return null;
        return '/login';
      }

      // Authenticated: redirect away from auth/splash screens into the app.
      if (location == '/splash' || isPublic) return '/home';

      return null;
    },
    routes: [
      // ── Auth / public routes (use rootNavigatorKey) ──────────────────────
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
        path: '/invite/:token',
        builder: (_, state) =>
            AcceptInvitationScreen(token: state.pathParameters['token']!),
      ),

      // ── Full-screen routes pushed above shell ────────────────────────────
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/projects/new',
        builder: (_, _) => const ProjectEditorScreen(),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/projects/:id',
        builder: (_, state) =>
            ProjectDetailScreen(projectId: state.pathParameters['id']!),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/projects/:id/edit',
        builder: (_, state) =>
            ProjectEditorScreen(projectId: state.pathParameters['id']),
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
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/admin',
        builder: (_, _) => const AdminHubScreen(),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/admin/users',
        builder: (_, _) => const AdminUsersScreen(),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/admin/users/:id',
        builder: (_, state) =>
            AdminUserDetailScreen(userId: state.pathParameters['id']!),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/admin/roles',
        builder: (_, _) => const AdminRolesScreen(),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/admin/jobs',
        builder: (_, _) => const AdminJobsScreen(),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/admin/mail',
        builder: (_, _) => const AdminMailScreen(),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/admin/settings',
        builder: (_, _) => const AdminSettingsScreen(),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/admin/notifications',
        builder: (_, _) => const AdminNotificationsScreen(),
      ),
      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/admin/audit-logs',
        builder: (_, _) => const AuditLogsScreen(),
      ),

      // ── Persistent shell with bottom NavigationBar ───────────────────────
      StatefulShellRoute.indexedStack(
        builder: (_, _, navigationShell) =>
            ShellScaffold(navigationShell: navigationShell),
        branches: [
          // Tab 0 — Home
          StatefulShellBranch(
            navigatorKey: _homeNavKey,
            routes: [
              GoRoute(path: '/home', builder: (_, _) => const HomeScreen()),
            ],
          ),

          // Tab 1 — Projects
          StatefulShellBranch(
            navigatorKey: _projectsNavKey,
            routes: [
              GoRoute(
                path: '/projects',
                builder: (_, _) => const ProjectsScreen(),
              ),
            ],
          ),

          // Tab 2 — Notifications
          StatefulShellBranch(
            navigatorKey: _notifNavKey,
            routes: [
              GoRoute(
                path: '/notifications',
                builder: (_, _) => const NotificationsScreen(),
              ),
            ],
          ),

          // Tab 3 — UI Kit / component gallery
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

          // Tab 4 — Profile
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
