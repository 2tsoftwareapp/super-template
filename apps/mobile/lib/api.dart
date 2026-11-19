import 'dart:convert';

import 'package:http/http.dart' as http;

/// Android emulator reaches the host through 10.0.2.2; override with
/// --dart-define=API_BASE_URL=http://<lan-ip>:3001 for a physical device.
const apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:3001',
);

class ApiException implements Exception {
  ApiException(this.message);

  final String message;

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
  ApiClient({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;
  String? _accessToken;

  Future<Session> login(String email, String password) async {
    final response = await _client.post(
      Uri.parse('$apiBaseUrl/api/v1/auth/login'),
      headers: {'content-type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final body = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode != 200) {
      throw ApiException(_errorMessage(body) ?? 'Login failed');
    }

    final data = body['data'] as Map<String, dynamic>;
    final session = Session(
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
      user: data['user'] as Map<String, dynamic>,
    );
    _accessToken = session.accessToken;

    return session;
  }

  Future<void> logout(String refreshToken) async {
    await _client.post(
      Uri.parse('$apiBaseUrl/api/v1/auth/logout'),
      headers: {'content-type': 'application/json'},
      body: jsonEncode({'refreshToken': refreshToken}),
    );
    _accessToken = null;
  }

  Future<Map<String, dynamic>> me() async {
    final response = await _client.get(
      Uri.parse('$apiBaseUrl/api/v1/auth/me'),
      headers: {'authorization': 'Bearer ${_accessToken ?? ''}'},
    );
    final body = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode != 200) {
      throw ApiException(_errorMessage(body) ?? 'Could not load the profile');
    }

    return body['data'] as Map<String, dynamic>;
  }

  String? _errorMessage(Map<String, dynamic> body) {
    final error = body['error'];

    return error is Map<String, dynamic> ? error['message'] as String? : null;
  }
}
