import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/config/app_config.dart';
import 'package:mobile_app/core/network/auth_interceptor.dart';
import 'package:super_template_api/super_template_api.dart';

final appConfigProvider = Provider<AppConfig>(
  (_) => AppConfig.fromEnvironment(),
);

final dioProvider = Provider<Dio>((ref) {
  final config = ref.watch(appConfigProvider);
  final dio = Dio(BaseOptions(baseUrl: config.apiBaseUrl));
  dio.interceptors.add(ref.watch(authInterceptorProvider));
  return dio;
});

final apiClientProvider = Provider<SuperTemplateApi>((ref) {
  return SuperTemplateApi(
    dio: ref.watch(dioProvider),
    serializers: standardSerializers,
  );
});
