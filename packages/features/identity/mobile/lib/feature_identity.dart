/// Route paths owned by the identity feature plugin.
///
/// The Flutter app registers GoRouter entries for these paths. Disabling the
/// identity plugin means removing the `feature_identity` path dependency and
/// the corresponding routes from `apps/mobile/lib/app/router.dart`.
class IdentityRoutes {
  const IdentityRoutes._();

  static const splash = '/splash';
  static const login = '/login';
  static const register = '/register';
  static const forgotPassword = '/forgot-password';
  static const verifyEmail = '/verify-email';
  static const resetPassword = '/reset-password';
  static const organizations = '/organizations';
  static const organizationDetail = '/organizations/:id';
  static const preferences = '/preferences';
  static const security = '/security';
  static const sessions = '/sessions';
}
