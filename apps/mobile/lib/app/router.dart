import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
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
import 'package:mobile_app/features/home/presentation/home_screen.dart';
import 'package:mobile_app/features/imports/presentation/imports_screen.dart';
import 'package:mobile_app/features/notifications/presentation/notifications_screen.dart';
import 'package:mobile_app/features/invitations/presentation/accept_invitation_screen.dart';
import 'package:mobile_app/features/organizations/presentation/organizations_screen.dart';
import 'package:mobile_app/features/profile/presentation/preferences_screen.dart';
import 'package:mobile_app/features/profile/presentation/profile_screen.dart';
import 'package:mobile_app/features/profile/presentation/security_screen.dart';
import 'package:mobile_app/features/profile/presentation/sessions_screen.dart';
import 'package:mobile_app/features/projects/presentation/project_detail_screen.dart';
import 'package:mobile_app/features/projects/presentation/project_editor_screen.dart';
import 'package:mobile_app/features/projects/presentation/projects_screen.dart';

final rootNavigatorKey = GlobalKey<NavigatorState>();

const _publicRoutes = {
  '/splash',
  '/login',
  '/register',
  '/forgot-password',
  '/verify-email',
  '/reset-password',
  '/organizations',
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

      if (isLoading) {
        return location == '/splash' ? null : '/splash';
      }

      if (!isAuthed) {
        if (isPublic && location != '/splash') {
          return null;
        }
        if (isInvite) {
          return null;
        }
        return '/login';
      }

      if (isPublic && location != '/organizations') {
        return '/home';
      }

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
        path: '/invite/:token',
        builder: (_, state) =>
            AcceptInvitationScreen(token: state.pathParameters['token']!),
      ),
      GoRoute(path: '/home', builder: (_, _) => const HomeScreen()),
      GoRoute(path: '/projects', builder: (_, _) => const ProjectsScreen()),
      GoRoute(
        path: '/projects/new',
        builder: (_, _) => const ProjectEditorScreen(),
      ),
      GoRoute(
        path: '/projects/:id',
        builder: (_, state) =>
            ProjectDetailScreen(projectId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/projects/:id/edit',
        builder: (_, state) =>
            ProjectEditorScreen(projectId: state.pathParameters['id']),
      ),
      GoRoute(
        path: '/notifications',
        builder: (_, _) => const NotificationsScreen(),
      ),
      GoRoute(path: '/profile', builder: (_, _) => const ProfileScreen()),
      GoRoute(
        path: '/preferences',
        builder: (_, _) => const PreferencesScreen(),
      ),
      GoRoute(path: '/security', builder: (_, _) => const SecurityScreen()),
      GoRoute(path: '/sessions', builder: (_, _) => const SessionsScreen()),
      GoRoute(
        path: '/organizations',
        builder: (_, _) => const OrganizationsScreen(),
      ),
      GoRoute(path: '/imports', builder: (_, _) => const ImportsScreen()),
      GoRoute(path: '/exports', builder: (_, _) => const ExportsScreen()),
      GoRoute(path: '/admin', builder: (_, _) => const AdminHubScreen()),
      GoRoute(
        path: '/admin/users',
        builder: (_, _) => const AdminUsersScreen(),
      ),
      GoRoute(
        path: '/admin/users/:id',
        builder: (_, state) =>
            AdminUserDetailScreen(userId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/admin/roles',
        builder: (_, _) => const AdminRolesScreen(),
      ),
      GoRoute(path: '/admin/jobs', builder: (_, _) => const AdminJobsScreen()),
      GoRoute(path: '/admin/mail', builder: (_, _) => const AdminMailScreen()),
      GoRoute(
        path: '/admin/settings',
        builder: (_, _) => const AdminSettingsScreen(),
      ),
      GoRoute(
        path: '/admin/notifications',
        builder: (_, _) => const AdminNotificationsScreen(),
      ),
      GoRoute(
        path: '/admin/audit-logs',
        builder: (_, _) => const AuditLogsScreen(),
      ),
    ],
  );
});
