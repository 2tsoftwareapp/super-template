import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/errors/app_exception.dart';

DioException _dioError({Object? data, int? statusCode, String? message}) {
  final options = RequestOptions(path: '/test');
  return DioException(
    requestOptions: options,
    message: message,
    response: data == null && statusCode == null
        ? null
        : Response(
            requestOptions: options,
            data: data,
            statusCode: statusCode,
          ),
  );
}

void main() {
  group('AppException.fromDio', () {
    test('maps the API error envelope to message/code/status', () {
      final exception = AppException.fromDio(
        _dioError(
          data: {
            'error': {'code': 'AUTH_FORBIDDEN', 'message': 'No access'},
          },
          statusCode: 403,
        ),
      );

      expect(exception.message, 'No access');
      expect(exception.code, 'AUTH_FORBIDDEN');
      expect(exception.statusCode, 403);
    });

    test('falls back to a generic message when the envelope is malformed', () {
      final exception = AppException.fromDio(
        _dioError(data: {'error': <String, dynamic>{}}, statusCode: 500),
      );

      expect(exception.message, 'Request failed');
      expect(exception.statusCode, 500);
    });

    test('uses the transport message when there is no response body', () {
      final exception = AppException.fromDio(
        _dioError(message: 'Connection refused'),
      );

      expect(exception.message, 'Connection refused');
      expect(exception.statusCode, isNull);
    });

    test('handles non-map payloads without crashing', () {
      final exception = AppException.fromDio(
        _dioError(data: 'plain text error', statusCode: 502),
      );

      expect(exception.message, 'Network request failed');
      expect(exception.statusCode, 502);
    });
  });
}
