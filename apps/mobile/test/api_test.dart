import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:lean_mobile/api.dart';

http.Response sessionResponse(String access, String refresh) => http.Response(
      jsonEncode({
        'data': {
          'accessToken': access,
          'refreshToken': refresh,
          'user': {'email': 'a@example.local', 'displayName': 'A'},
        },
      }),
      200,
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('restores a stored session through the refresh endpoint', () async {
    FlutterSecureStorage.setMockInitialValues({'refresh_token': 'stored'});
    final api = ApiClient(
      client: MockClient((request) async {
        expect(request.url.path, '/api/v1/auth/refresh');
        expect(jsonDecode(request.body), {'refreshToken': 'stored'});
        return sessionResponse('a2', 'r2');
      }),
    );

    final session = await api.restore();

    expect(session?.accessToken, 'a2');
    expect(await const FlutterSecureStorage().read(key: 'refresh_token'), 'r2');
  });

  test('refreshes once when the access token has expired', () async {
    FlutterSecureStorage.setMockInitialValues({});
    final paths = <String>[];
    final api = ApiClient(
      client: MockClient((request) async {
        paths.add(request.url.path);
        switch (request.url.path) {
          case '/api/v1/auth/login':
            return sessionResponse('expired', 'r1');
          case '/api/v1/auth/refresh':
            return sessionResponse('fresh', 'r2');
          default:
            return request.headers['authorization'] == 'Bearer fresh'
                ? http.Response(
                    jsonEncode({
                      'data': {'email': 'a@example.local'}
                    }),
                    200)
                : http.Response('{}', 401);
        }
      }),
    );

    await api.login('a@example.local', 'password1');
    final profile = await api.me();

    expect(profile['email'], 'a@example.local');
    expect(paths, [
      '/api/v1/auth/login',
      '/api/v1/auth/me',
      '/api/v1/auth/refresh',
      '/api/v1/auth/me'
    ]);
  });

  test('logout clears the device even when the server is unreachable',
      () async {
    FlutterSecureStorage.setMockInitialValues({});
    final api = ApiClient(
      client: MockClient((request) async {
        if (request.url.path == '/api/v1/auth/logout') {
          throw http.ClientException('offline');
        }
        return sessionResponse('a1', 'r1');
      }),
    );

    await api.login('a@example.local', 'password1');

    await expectLater(api.logout(), throwsA(isA<http.ClientException>()));
    expect(api.session, isNull);
    expect(
        await const FlutterSecureStorage().read(key: 'refresh_token'), isNull);
  });

  test('keeps the stored token when the server is temporarily down', () async {
    FlutterSecureStorage.setMockInitialValues({'refresh_token': 'stored'});
    final api = ApiClient(
      client: MockClient((_) async => http.Response('bad gateway', 503)),
    );

    await expectLater(api.restore(), throwsA(isA<ApiException>()));
    expect(await const FlutterSecureStorage().read(key: 'refresh_token'),
        'stored');
  });

  test('drops the stored token once the server rejects it', () async {
    FlutterSecureStorage.setMockInitialValues({'refresh_token': 'stale'});
    final api = ApiClient(
      client: MockClient((_) async => http.Response('{}', 401)),
    );

    expect(await api.restore(), isNull);
    expect(
        await const FlutterSecureStorage().read(key: 'refresh_token'), isNull);
  });
}
