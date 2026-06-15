import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/auth/token_bundle.dart';
import 'package:mobile_app/core/auth/token_storage.dart';
import 'package:mobile_app/core/errors/app_exception.dart';
import 'package:mobile_app/features/auth/data/auth_repository.dart';

final authInterceptorProvider = Provider<AuthInterceptor>(
  (ref) => AuthInterceptor(ref),
);

class AuthInterceptor extends Interceptor {
  AuthInterceptor(this._ref);

  final Ref _ref;
  Future<TokenBundle?>? _refreshFlight;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final tokens = await _ref.read(tokenStorageProvider).read();
    if (tokens != null) {
      options.headers['authorization'] = 'Bearer ${tokens.accessToken}';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode != 401 ||
        err.requestOptions.extra['retried'] == true) {
      handler.next(err);
      return;
    }

    try {
      final refreshed = await (_refreshFlight ??= _refresh());
      _refreshFlight = null;

      if (refreshed == null) {
        handler.next(err);
        return;
      }

      final request = err.requestOptions;
      request.headers['authorization'] = 'Bearer ${refreshed.accessToken}';
      request.extra['retried'] = true;
      final retryDio = Dio(BaseOptions(baseUrl: request.baseUrl));
      final response = await retryDio.fetch<dynamic>(request);
      handler.resolve(response);
    } on AppException {
      _refreshFlight = null;
      await _ref.read(tokenStorageProvider).clear();
      handler.next(err);
    }
  }

  Future<TokenBundle?> _refresh() async {
    return _ref.read(authRepositoryProvider).refresh();
  }
}
