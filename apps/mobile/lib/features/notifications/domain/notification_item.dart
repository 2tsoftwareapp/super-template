class NotificationItem {
  const NotificationItem({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.isRead,
  });

  final String id;
  final String type;
  final String title;
  final String body;
  final bool isRead;
}
