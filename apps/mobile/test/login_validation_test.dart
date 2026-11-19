import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/auth/domain/login_validation.dart';

void main() {
  test('login validation rejects short password', () {
    expect(isValidLogin('user@example.local', 'short'), isFalse);
  });

  test('login validation accepts a valid email and password', () {
    expect(isValidLogin('user@example.local', 'ChangeMe123!'), isTrue);
  });
}
