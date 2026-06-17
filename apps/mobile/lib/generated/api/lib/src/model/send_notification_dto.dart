// AUTO-GENERATED FILE, DO NOT MODIFY BY HAND.
//
// Deprecated compatibility wrapper retained for API surface stability.
//
// @dart=3.0

/// SendNotificationDto
///
/// Deprecated compatibility model retained for older clients.
@Deprecated('Use SendNotificationRequestDto instead.')
class SendNotificationDto {
  const SendNotificationDto({
    required this.userId,
    required this.type,
    required this.title,
    required this.body,
    this.data,
  });

  final String userId;
  final String type;
  final String title;
  final String body;
  final Map<String, Object?>? data;
}
