import 'dart:convert';

import 'package:http/http.dart' as http;

import 'session_store.dart';

/// Android emulator reaches the host through 10.0.2.2; override with
/// --dart-define=API_BASE_URL=http://<lan-ip>:3001 for a physical device.
const apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:3001',
);

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class Session {
  Session(
      {required this.accessToken,
      required this.refreshToken,
      required this.user});

  final String accessToken;
  final String refreshToken;
  final Map<String, dynamic> user;

  String get displayName => user['displayName'] as String? ?? 'User';
}

class ApiClient {
  ApiClient({http.Client? client, SessionStore? store})
      : _client = client ?? http.Client(),
        _store = store ?? SessionStore();

  final http.Client _client;
  final SessionStore _store;
  Session? _session;

  Session? get session => _session;

  Future<Session> login(String email, String password) async {
    final response =
        await _post('/auth/login', {'email': email, 'password': password});

    return _adopt(response, 'Login failed');
  }

  /// Signs back in with the stored refresh token; null when there is none or
  /// the server no longer accepts it.
  Future<Session?> restore() async {
    final refreshToken = await _store.readRefreshToken();

    if (refreshToken == null) return null;

    try {
      return await _refresh(refreshToken);
    } on ApiException {
      await _store.clear();
      return null;
    }
  }

  /// Local state is cleared first, so the device is signed out even when the
  /// server cannot be reached; that network error is still reported.
  Future<void> logout() async {
    final refreshToken = _session?.refreshToken;
    _session = null;
    await _store.clear();

    if (refreshToken != null) {
      await _post('/auth/logout', {'refreshToken': refreshToken});
    }
  }

  /// The access token lives 15 minutes: on 401 refresh once and retry.
  Future<Map<String, dynamic>> me() async {
    var response = await _getMe();
    final current = _session;

    if (response.statusCode == 401 && current != null) {
      await _refresh(current.refreshToken);
      response = await _getMe();
    }

    final body = _decode(response);

    if (response.statusCode != 200) {
      throw ApiException(_errorMessage(body) ?? 'Could not load the profile',
          statusCode: response.statusCode);
    }

    return body['data'] as Map<String, dynamic>;
  }

  Future<Session> _refresh(String refreshToken) async {
    final response =
        await _post('/auth/refresh', {'refreshToken': refreshToken});

    return _adopt(response, 'Session expired');
  }

  Future<Session> _adopt(http.Response response, String fallback) async {
    final body = _decode(response);

    if (response.statusCode != 200) {
      throw ApiException(_errorMessage(body) ?? fallback,
          statusCode: response.statusCode);
    }

    final data = body['data'] as Map<String, dynamic>;
    final session = Session(
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
      user: data['user'] as Map<String, dynamic>,
    );
    _session = session;
    await _store.saveRefreshToken(session.refreshToken);

    return session;
  }

  Future<http.Response> _getMe() => _client.get(
        Uri.parse('$apiBaseUrl/api/v1/auth/me'),
        headers: {'authorization': 'Bearer ${_session?.accessToken ?? ''}'},
      );

  Future<http.Response> _post(String path, Map<String, String> body) =>
      _client.post(
        Uri.parse('$apiBaseUrl/api/v1$path'),
        headers: {'content-type': 'application/json'},
        body: jsonEncode(body),
      );

  /// A proxy error page is not JSON; treat it as an empty envelope.
  Map<String, dynamic> _decode(http.Response response) {
    try {
      final decoded = jsonDecode(response.body);
      return decoded is Map<String, dynamic> ? decoded : <String, dynamic>{};
    } on FormatException {
      return <String, dynamic>{};
    }
  }

  String? _errorMessage(Map<String, dynamic> body) {
    final error = body['error'];

    return error is Map<String, dynamic> ? error['message'] as String? : null;
  }
}
