import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/config/app_config.dart';
import 'package:mobile_app/core/network/auth_interceptor.dart';
import 'package:super_template_api/super_template_api.dart';

final appConfigProvider = Provider<AppConfig>(
  (_) => AppConfig.fromEnvironment(),
);

const _kConnectTimeout = Duration(seconds: 10);
const _kReceiveTimeout = Duration(seconds: 15);

BaseOptions _baseOptions(String baseUrl) => BaseOptions(
  baseUrl: baseUrl,
  connectTimeout: _kConnectTimeout,
  receiveTimeout: _kReceiveTimeout,
);

/// Dio without auth interceptor — for login, register, token refresh, etc.
final publicDioProvider = Provider<Dio>((ref) {
  final config = ref.watch(appConfigProvider);
  return Dio(_baseOptions(config.apiBaseUrl));
});

/// Dio with auth interceptor — for all protected API calls.
final dioProvider = Provider<Dio>((ref) {
  final config = ref.watch(appConfigProvider);
  final dio = Dio(_baseOptions(config.apiBaseUrl));
  final authInterceptor = ref.watch(authInterceptorProvider);
  authInterceptor.dio = dio;
  dio.interceptors.add(authInterceptor);
  return dio;
});

/// API client for public (unauthenticated) endpoints.
final publicApiClientProvider = Provider<SuperTemplateApi>((ref) {
  return SuperTemplateApi(
    dio: ref.watch(publicDioProvider),
    serializers: standardSerializers,
  );
});

/// API client for protected (authenticated) endpoints.
final apiClientProvider = Provider<SuperTemplateApi>((ref) {
  return SuperTemplateApi(
    dio: ref.watch(dioProvider),
    serializers: standardSerializers,
  );
});
