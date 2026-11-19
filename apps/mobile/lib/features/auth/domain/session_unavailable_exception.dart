/// The stored session could not be verified because the backend was
/// unreachable or returned a server error.
///
/// Tokens are kept, so the check can be retried instead of treating the user
/// as signed out.
class SessionUnavailableException implements Exception {
  const SessionUnavailableException({this.statusCode});

  /// `null` for transport failures (offline, timeout, DNS).
  final int? statusCode;

  @override
  String toString() => statusCode == null
      ? 'Could not reach the server. Check your connection and try again.'
      : 'The server is unavailable. Please try again.';
}
