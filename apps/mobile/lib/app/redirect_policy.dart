import 'package:feature_identity/feature_identity.dart';

/// Routes an unauthenticated user is allowed to land on.
const publicRoutes = <String>{
  IdentityRoutes.splash,
  IdentityRoutes.login,
  IdentityRoutes.register,
  IdentityRoutes.forgotPassword,
  IdentityRoutes.verifyEmail,
  IdentityRoutes.resetPassword,
};

/// Auth gate used by `GoRouter.redirect` and by the router tests.
///
/// Returns the location to redirect to, or `null` when [location] may render.
String? resolveRedirect({
  required bool isAuthenticated,
  required bool isLoading,
  required bool hasError,
  required String location,
}) {
  if (isLoading) {
    return location == IdentityRoutes.splash ? null : IdentityRoutes.splash;
  }

  // The session could not be verified (offline / 5xx). Tokens are kept, so
  // hold on the splash screen, which offers a retry, instead of logging the
  // user out.
  if (hasError) {
    return location == IdentityRoutes.splash ? null : IdentityRoutes.splash;
  }

  final isPublic = publicRoutes.contains(location);

  if (!isAuthenticated) {
    if (location == IdentityRoutes.splash) return IdentityRoutes.login;
    if (isPublic) return null;
    return IdentityRoutes.login;
  }

  if (location == IdentityRoutes.splash || isPublic) return '/home';

  return null;
}
