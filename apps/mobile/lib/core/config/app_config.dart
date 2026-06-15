class AppConfig {
  const AppConfig({required this.appEnv, required this.apiBaseUrl});

  final String appEnv;
  final String apiBaseUrl;

  static AppConfig fromEnvironment() {
    return AppConfig(
      appEnv: const String.fromEnvironment(
        'APP_ENV',
        defaultValue: 'development',
      ),
      apiBaseUrl: const String.fromEnvironment(
        'API_BASE_URL',
        defaultValue: 'http://localhost:3001/api/v1',
      ),
    );
  }
}
