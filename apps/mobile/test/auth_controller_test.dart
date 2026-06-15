import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/auth/domain/auth_session.dart';

void main() {
  test('auth session reports authenticated state', () {
    const session = AuthSession(
      userId: 'user-1',
      email: 'user@example.local',
      displayName: 'User',
      roles: ['USER'],
      permissions: ['projects.read'],
      sessionId: 'session-1',
    );

    expect(session.isAuthenticated, isTrue);
  });
}
