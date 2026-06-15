import 'package:flutter_test/flutter_test.dart';

String resolveRedirect({
  required bool isAuthenticated,
  required bool isLoading,
  required String location,
}) {
  final isPublic = {
    '/splash',
    '/login',
    '/register',
    '/forgot-password',
  }.contains(location);
  if (isLoading && location != '/splash') {
    return '/splash';
  }
  if (!isAuthenticated && !isPublic) {
    return '/login';
  }
  if (isAuthenticated && isPublic && location != '/splash') {
    return '/home';
  }
  return location;
}

void main() {
  test('router redirects guest to login', () {
    expect(
      resolveRedirect(
        isAuthenticated: false,
        isLoading: false,
        location: '/projects',
      ),
      '/login',
    );
  });
}
