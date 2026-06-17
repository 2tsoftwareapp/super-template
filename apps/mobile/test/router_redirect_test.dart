import 'package:flutter_test/flutter_test.dart';

// Pure function mirroring the redirect logic in router.dart.
String? resolveRedirect({
  required bool isAuthenticated,
  required bool isLoading,
  required String location,
}) {
  const publicRoutes = {
    '/splash',
    '/login',
    '/register',
    '/forgot-password',
    '/verify-email',
    '/reset-password',
  };
  final isPublic = publicRoutes.contains(location);
  final isInvite = location.startsWith('/invite/');

  if (isLoading) {
    return location == '/splash' ? null : '/splash';
  }

  if (!isAuthenticated) {
    if (isPublic && location != '/splash') {
      return null;
    }
    if (isInvite) {
      return '/login';
    }
    return '/login';
  }

  if (isPublic) {
    return '/home';
  }

  return null;
}

void main() {
  group('loading state', () {
    test('stays on /splash while loading', () {
      expect(
        resolveRedirect(
          isAuthenticated: false,
          isLoading: true,
          location: '/splash',
        ),
        null,
      );
    });

    test('redirects other routes to /splash while loading', () {
      expect(
        resolveRedirect(
          isAuthenticated: false,
          isLoading: true,
          location: '/home',
        ),
        '/splash',
      );
    });

    test('redirects protected routes to /splash while loading', () {
      expect(
        resolveRedirect(
          isAuthenticated: false,
          isLoading: true,
          location: '/projects',
        ),
        '/splash',
      );
    });
  });

  group('unauthenticated', () {
    test('/splash redirects to /login when done loading', () {
      expect(
        resolveRedirect(
          isAuthenticated: false,
          isLoading: false,
          location: '/splash',
        ),
        '/login',
      );
    });

    test('/login renders without redirect', () {
      expect(
        resolveRedirect(
          isAuthenticated: false,
          isLoading: false,
          location: '/login',
        ),
        null,
      );
    });

    test('/register renders without redirect', () {
      expect(
        resolveRedirect(
          isAuthenticated: false,
          isLoading: false,
          location: '/register',
        ),
        null,
      );
    });

    test('/forgot-password renders without redirect', () {
      expect(
        resolveRedirect(
          isAuthenticated: false,
          isLoading: false,
          location: '/forgot-password',
        ),
        null,
      );
    });

    test('/verify-email renders without redirect', () {
      expect(
        resolveRedirect(
          isAuthenticated: false,
          isLoading: false,
          location: '/verify-email',
        ),
        null,
      );
    });

    test('/reset-password renders without redirect', () {
      expect(
        resolveRedirect(
          isAuthenticated: false,
          isLoading: false,
          location: '/reset-password',
        ),
        null,
      );
    });

    test('/invite/:token redirects to /login', () {
      expect(
        resolveRedirect(
          isAuthenticated: false,
          isLoading: false,
          location: '/invite/abc123',
        ),
        '/login',
      );
    });

    test('protected route redirects to /login', () {
      expect(
        resolveRedirect(
          isAuthenticated: false,
          isLoading: false,
          location: '/projects',
        ),
        '/login',
      );
    });

    test('/home redirects to /login when unauthenticated', () {
      expect(
        resolveRedirect(
          isAuthenticated: false,
          isLoading: false,
          location: '/home',
        ),
        '/login',
      );
    });
  });

  group('authenticated', () {
    test('/splash redirects to /home', () {
      expect(
        resolveRedirect(
          isAuthenticated: true,
          isLoading: false,
          location: '/splash',
        ),
        '/home',
      );
    });

    test('/login redirects to /home', () {
      expect(
        resolveRedirect(
          isAuthenticated: true,
          isLoading: false,
          location: '/login',
        ),
        '/home',
      );
    });

    test('/register redirects to /home', () {
      expect(
        resolveRedirect(
          isAuthenticated: true,
          isLoading: false,
          location: '/register',
        ),
        '/home',
      );
    });

    test('/forgot-password redirects to /home', () {
      expect(
        resolveRedirect(
          isAuthenticated: true,
          isLoading: false,
          location: '/forgot-password',
        ),
        '/home',
      );
    });

    test('/verify-email redirects to /home', () {
      expect(
        resolveRedirect(
          isAuthenticated: true,
          isLoading: false,
          location: '/verify-email',
        ),
        '/home',
      );
    });

    test('/reset-password redirects to /home', () {
      expect(
        resolveRedirect(
          isAuthenticated: true,
          isLoading: false,
          location: '/reset-password',
        ),
        '/home',
      );
    });

    test('protected route renders without redirect', () {
      expect(
        resolveRedirect(
          isAuthenticated: true,
          isLoading: false,
          location: '/projects',
        ),
        null,
      );
    });

    test('/admin renders without redirect', () {
      expect(
        resolveRedirect(
          isAuthenticated: true,
          isLoading: false,
          location: '/admin',
        ),
        null,
      );
    });

    test('/home renders without redirect', () {
      expect(
        resolveRedirect(
          isAuthenticated: true,
          isLoading: false,
          location: '/home',
        ),
        null,
      );
    });
  });
}
