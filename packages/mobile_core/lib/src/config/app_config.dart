import 'dart:io';

/// Runtime environments the app can be built for. Mirrors the backend APP_ENV.
enum AppEnv { development, staging, production }

AppEnv _parseAppEnv(String value) {
  switch (value) {
    case 'staging':
      return AppEnv.staging;
    case 'production':
    case 'prod':
      return AppEnv.production;
    default:
      return AppEnv.development;
  }
}

class AppConfig {
  const AppConfig({required this.env, required this.apiBaseUrl});

  final AppEnv env;
  final String apiBaseUrl;

  String get appEnv => env.name;

  bool get isDevelopment => env == AppEnv.development;
  bool get isStaging => env == AppEnv.staging;
  bool get isProduction => env == AppEnv.production;

  /// Resolves [API_BASE_URL] for the current platform.
  ///
  /// On Android emulators, `localhost` / `127.0.0.1` point at the emulator itself.
  /// Rewrite those hosts to `10.0.2.2`, which reaches the developer machine.
  static String resolveApiBaseUrl(String defined, {bool? isAndroid}) {
    final android = isAndroid ?? Platform.isAndroid;

    if (defined.isEmpty) {
      return android ? 'http://10.0.2.2:3001' : 'http://localhost:3001';
    }

    if (!android) {
      return defined;
    }

    final uri = Uri.tryParse(defined);
    if (uri == null || !uri.hasScheme) {
      return defined;
    }

    if (uri.host == 'localhost' || uri.host == '127.0.0.1') {
      return uri.replace(host: '10.0.2.2').toString();
    }

    return defined;
  }

  static AppConfig fromEnvironment() {
    const rawEnv = String.fromEnvironment(
      'APP_ENV',
      defaultValue: 'development',
    );
    final env = _parseAppEnv(rawEnv);

    const defined = String.fromEnvironment('API_BASE_URL');
    final apiBaseUrl = resolveApiBaseUrl(defined);

    return AppConfig(env: env, apiBaseUrl: apiBaseUrl);
  }
}
