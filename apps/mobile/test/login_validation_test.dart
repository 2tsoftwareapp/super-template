import 'package:flutter_test/flutter_test.dart';

bool isValidLogin(String email, String password) {
  return email.contains('@') && password.length >= 8;
}

void main() {
  test('login validation rejects short password', () {
    expect(isValidLogin('user@example.local', 'short'), isFalse);
  });
}
