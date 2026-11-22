import 'dart:convert';

import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

import 'models.dart';
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
  /// the server rejected it. Outages (5xx, network) keep the token and throw.
  Future<Session?> restore() async {
    final refreshToken = await _store.readRefreshToken();

    if (refreshToken == null) return null;

    try {
      return await _refresh(refreshToken);
    } on ApiException catch (error) {
      if (error.statusCode != 401 && error.statusCode != 403) rethrow;
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

  Future<Map<String, dynamic>> me() async {
    final body = await _expect(
        () => _client.get(_uri('/auth/me'), headers: _auth()),
        'Could not load the profile');

    return body['data'] as Map<String, dynamic>;
  }

  Future<List<AppNotification>> notifications() async {
    final body = await _expect(
        () => _client.get(_uri('/notifications?limit=50'), headers: _auth()),
        'Could not load notifications');

    return (body['data'] as List<dynamic>)
        .map((item) => AppNotification.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<void> markRead(String id) => _expect(
      () => _client.patch(_uri('/notifications/$id/read'), headers: _auth()),
      'Could not mark the notification as read');

  Future<List<StoredFile>> files() async {
    final body = await _expect(
        () => _client.get(_uri('/files?limit=50'), headers: _auth()),
        'Could not load files');

    return (body['data'] as List<dynamic>)
        .map((item) => StoredFile.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  /// Multipart upload to POST /files; the type comes from the file extension.
  Future<StoredFile> upload(String name, Uint8List bytes) async {
    final extension = name.contains('.') ? name.split('.').last : '';
    final mimeType = uploadMimeTypes[extension.toLowerCase()];

    if (mimeType == null) {
      throw ApiException('Only images, PDF, TXT and CSV files can be uploaded');
    }

    final body = await _expect(() async {
      final request = http.MultipartRequest('POST', _uri('/files'))
        ..headers.addAll(_auth())
        ..files.add(http.MultipartFile.fromBytes('file', bytes,
            filename: name, contentType: MediaType.parse(mimeType)));
      return http.Response.fromStream(await _client.send(request));
    }, 'Upload failed');

    return StoredFile.fromJson(body['data'] as Map<String, dynamic>);
  }

  /// The access token lives 15 minutes: on 401 refresh once and resend.
  Future<Map<String, dynamic>> _expect(
      Future<http.Response> Function() send, String fallback) async {
    var response = await send();
    final current = _session;

    if (response.statusCode == 401 && current != null) {
      await _refresh(current.refreshToken);
      response = await send();
    }

    final body = _decode(response);

    if (response.statusCode >= 300) {
      throw ApiException(_errorMessage(body) ?? fallback,
          statusCode: response.statusCode);
    }

    return body;
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

  Uri _uri(String path) => Uri.parse('$apiBaseUrl/api/v1$path');

  Map<String, String> _auth() =>
      {'authorization': 'Bearer ${_session?.accessToken ?? ''}'};

  Future<http.Response> _post(String path, Map<String, String> body) =>
      _client.post(
        _uri(path),
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
