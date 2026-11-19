import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/app/redirect_policy.dart';

void main() {
  group('loading state', () {
    test('stays on /splash while loading', () {
      expect(
        resolveRedirect(
          isAuthenticated: false,
          isLoading: true,
          hasError: false,
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
          hasError: false,
          location: '/home',
        ),
        '/splash',
      );
    });
  });

  group('session unavailable', () {
    test('stays on /splash when the session check failed', () {
      expect(
        resolveRedirect(
          isAuthenticated: false,
          isLoading: false,
          hasError: true,
          location: '/splash',
        ),
        null,
      );
    });

    test('keeps splash for protected routes when the session check failed', () {
      expect(
        resolveRedirect(
          isAuthenticated: false,
          isLoading: false,
          hasError: true,
          location: '/home',
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
          hasError: false,
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
          hasError: false,
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
          hasError: false,
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
          hasError: false,
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
          hasError: false,
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
          hasError: false,
          location: '/reset-password',
        ),
        null,
      );
    });

    test('protected route redirects to /login', () {
      expect(
        resolveRedirect(
          isAuthenticated: false,
          isLoading: false,
          hasError: false,
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
          hasError: false,
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
          hasError: false,
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
          hasError: false,
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
          hasError: false,
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
          hasError: false,
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
          hasError: false,
          location: '/reset-password',
        ),
        '/home',
      );
    });

    test('/notifications renders without redirect', () {
      expect(
        resolveRedirect(
          isAuthenticated: true,
          isLoading: false,
          hasError: false,
          location: '/notifications',
        ),
        null,
      );
    });

    test('/home renders without redirect', () {
      expect(
        resolveRedirect(
          isAuthenticated: true,
          isLoading: false,
          hasError: false,
          location: '/home',
        ),
        null,
      );
    });
  });
}
