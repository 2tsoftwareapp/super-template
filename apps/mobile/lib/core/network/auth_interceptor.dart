import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/auth/token_bundle.dart';
import 'package:mobile_app/core/auth/token_storage.dart';
import 'package:mobile_app/core/errors/app_exception.dart';
import 'package:mobile_app/features/auth/data/auth_repository.dart';
import 'package:mobile_app/features/auth/presentation/auth_controller.dart';

final authInterceptorProvider = Provider<AuthInterceptor>(
  (ref) => AuthInterceptor(ref),
);

class AuthInterceptor extends Interceptor {
  AuthInterceptor(this._ref, {Dio? dio, HttpClientAdapter? httpClientAdapter})
    : _dio = dio,
      _httpClientAdapter = httpClientAdapter;

  final Ref _ref;
  Dio? _dio;
  HttpClientAdapter? _httpClientAdapter;

  set dio(Dio? dio) => _dio = dio;
  set httpClientAdapter(HttpClientAdapter? adapter) =>
      _httpClientAdapter = adapter;

  /// Shared future for in-flight token refresh.
  /// Concurrent 401s await the same future so refresh is called only once.
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

      if (refreshed == null) {
        handler.next(err);
        return;
      }

      final request = err.requestOptions;
      request.headers['authorization'] = 'Bearer ${refreshed.accessToken}';
      request.extra['retried'] = true;
      final retryDio = Dio(BaseOptions(baseUrl: request.baseUrl));
      if (_dio != null) {
        retryDio.httpClientAdapter = _dio!.httpClientAdapter;
      } else if (_httpClientAdapter != null) {
        retryDio.httpClientAdapter = _httpClientAdapter!;
      }
      final response = await retryDio.fetch<dynamic>(request);
      handler.resolve(response);
    } on AppException {
      await _ref.read(tokenStorageProvider).clear();
      _ref.read(authControllerProvider.notifier).invalidate();
      handler.next(err);
    } catch (_) {
      handler.next(err);
    } finally {
      _refreshFlight = null;
    }
  }

  Future<TokenBundle?> _refresh() =>
      _ref.read(authRepositoryProvider).refresh();
}
