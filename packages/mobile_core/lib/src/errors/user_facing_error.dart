import 'package:mobile_core/src/errors/app_exception.dart';

const _defaultFallback = 'Something went wrong. Please try again.';

/// Returns a safe, user-facing message without leaking raw exception details.
String userFacingErrorMessage(
  Object error, {
  String fallback = _defaultFallback,
}) {
  if (error is AppException) {
    return error.message;
  }
  if (error is String && error.isNotEmpty) {
    return error;
  }
  return fallback;
}
