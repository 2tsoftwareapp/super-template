import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:lean_mobile/api.dart';
import 'package:lean_mobile/screens/login_screen.dart';

ApiClient fakeApi(http.Response response) =>
    ApiClient(client: MockClient((_) async => response));

void main() {
  testWidgets('renders the login form', (tester) async {
    await tester.pumpWidget(
      MaterialApp(home: LoginScreen(api: fakeApi(http.Response('{}', 500)))),
    );

    expect(find.widgetWithText(FilledButton, 'Sign in'), findsOneWidget);
    expect(find.byType(TextField), findsNWidgets(2));
  });

  testWidgets('shows the API error message when login fails', (tester) async {
    final body = jsonEncode({
      'error': {
        'code': 'AUTH_INVALID_CREDENTIALS',
        'message': 'Invalid email or password'
      },
    });
    final api = fakeApi(
      http.Response(body, 401, headers: {'content-type': 'application/json'}),
    );

    await tester.pumpWidget(MaterialApp(home: LoginScreen(api: api)));
    await tester.enterText(find.byType(TextField).last, 'wrong-password');
    await tester.tap(find.widgetWithText(FilledButton, 'Sign in'));
    await tester.pumpAndSettle();

    expect(find.text('Invalid email or password'), findsOneWidget);
  });
}
