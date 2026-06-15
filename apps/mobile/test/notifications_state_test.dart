import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/notifications/domain/notification_item.dart';

void main() {
  test('notification unread state is preserved', () {
    const item = NotificationItem(
      id: 'n1',
      type: 'project.assigned',
      title: 'Assigned',
      body: 'You have a project.',
      isRead: false,
    );

    expect(item.isRead, isFalse);
  });
}
