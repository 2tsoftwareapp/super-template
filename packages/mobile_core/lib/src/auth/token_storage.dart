import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/src/auth/token_bundle.dart';
import 'package:mobile_core/src/storage/secure_store.dart';

class TokenStorage {
  TokenStorage(this._store);

  final SecureStore _store;

  /// Avoids two secure-storage round-trips per API request. `null` means the
  /// cache is cold; the store is the source of truth on first read.
  TokenBundle? _cache;

  static const _accessKey = 'access_token';
  static const _refreshKey = 'refresh_token';

  Future<TokenBundle?> read() async {
    final cached = _cache;
    if (cached != null) {
      return cached;
    }

    final accessToken = await _store.read(_accessKey);
    final refreshToken = await _store.read(_refreshKey);
    if (accessToken == null || refreshToken == null) {
      return null;
    }
    final tokens = TokenBundle(
      accessToken: accessToken,
      refreshToken: refreshToken,
    );
    _cache = tokens;
    return tokens;
  }

  Future<void> write(TokenBundle tokens) async {
    await _store.write(_accessKey, tokens.accessToken);
    await _store.write(_refreshKey, tokens.refreshToken);
    _cache = tokens;
  }

  Future<void> clear() async {
    // Drop the cache first: tokens must stop being served even if a delete
    // below fails.
    _cache = null;
    await _store.delete(_accessKey);
    await _store.delete(_refreshKey);
  }
}

final tokenStorageProvider = Provider<TokenStorage>(
  (ref) => TokenStorage(ref.watch(secureStoreProvider)),
);
