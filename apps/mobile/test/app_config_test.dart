import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/config/app_config.dart';

void main() {
  group('AppConfig.resolveApiBaseUrl', () {
    test('defaults to localhost on non-Android', () {
      expect(
        AppConfig.resolveApiBaseUrl('', isAndroid: false),
        'http://localhost:3001',
      );
    });

    test('defaults to 10.0.2.2 on Android', () {
      expect(
        AppConfig.resolveApiBaseUrl('', isAndroid: true),
        'http://10.0.2.2:3001',
      );
    });

    test('rewrites localhost on Android emulator', () {
      expect(
        AppConfig.resolveApiBaseUrl('http://localhost:3001', isAndroid: true),
        'http://10.0.2.2:3001',
      );
    });

    test('rewrites 127.0.0.1 on Android emulator', () {
      expect(
        AppConfig.resolveApiBaseUrl('http://127.0.0.1:3001', isAndroid: true),
        'http://10.0.2.2:3001',
      );
    });

    test('keeps localhost on iOS simulator', () {
      expect(
        AppConfig.resolveApiBaseUrl('http://localhost:3001', isAndroid: false),
        'http://localhost:3001',
      );
    });

    test('keeps remote hosts on Android', () {
      expect(
        AppConfig.resolveApiBaseUrl(
          'https://api.staging.example.com',
          isAndroid: true,
        ),
        'https://api.staging.example.com',
      );
    });
  });
}
