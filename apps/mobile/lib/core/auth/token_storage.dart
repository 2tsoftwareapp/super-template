import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/auth/token_bundle.dart';
import 'package:mobile_app/core/storage/secure_store.dart';

class TokenStorage {
  TokenStorage(this._store);

  final SecureStore _store;
  static const _accessKey = 'access_token';
  static const _refreshKey = 'refresh_token';

  Future<TokenBundle?> read() async {
    final accessToken = await _store.read(_accessKey);
    final refreshToken = await _store.read(_refreshKey);
    if (accessToken == null || refreshToken == null) {
      return null;
    }
    return TokenBundle(accessToken: accessToken, refreshToken: refreshToken);
  }

  Future<void> write(TokenBundle tokens) async {
    await _store.write(_accessKey, tokens.accessToken);
    await _store.write(_refreshKey, tokens.refreshToken);
  }

  Future<void> clear() async {
    await _store.delete(_accessKey);
    await _store.delete(_refreshKey);
  }
}

final tokenStorageProvider = Provider<TokenStorage>(
  (ref) => TokenStorage(ref.watch(secureStoreProvider)),
);
