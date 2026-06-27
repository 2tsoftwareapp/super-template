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

  static AppConfig fromEnvironment() {
    const rawEnv = String.fromEnvironment(
      'APP_ENV',
      defaultValue: 'development',
    );
    final env = _parseAppEnv(rawEnv);

    // --dart-define=API_BASE_URL=... (usually via --dart-define-from-file) wins.
    // When not provided, fall back to localhost with an Android-emulator fix:
    // on Android the loopback address of the host machine is 10.0.2.2.
    const defined = String.fromEnvironment('API_BASE_URL');
    final apiBaseUrl = defined.isNotEmpty
        ? defined
        : Platform.isAndroid
        ? 'http://10.0.2.2:3001'
        : 'http://localhost:3001';

    return AppConfig(env: env, apiBaseUrl: apiBaseUrl);
  }
}
