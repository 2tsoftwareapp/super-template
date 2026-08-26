import 'package:dio/dio.dart';

class AppException implements Exception {
  const AppException(this.message, {this.code, this.statusCode});

  final String message;
  final String? code;
  final int? statusCode;

  factory AppException.fromDio(DioException error) {
    final data = error.response?.data;
    if (data is Map<String, dynamic> && data['error'] is Map<String, dynamic>) {
      final payload = data['error'] as Map<String, dynamic>;
      return AppException(
        payload['message']?.toString() ?? 'Request failed',
        code: payload['code']?.toString(),
        statusCode: error.response?.statusCode,
      );
    }
    return AppException(
      error.message ?? 'Network request failed',
      statusCode: error.response?.statusCode,
    );
  }

  @override
  String toString() => message;
}

class MfaRequiredException implements Exception {
  const MfaRequiredException({required this.mfaToken});

  final String mfaToken;

  @override
  String toString() => 'MFA verification required';
}
