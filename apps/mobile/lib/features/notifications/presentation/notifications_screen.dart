import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/features/notifications/data/notifications_repository.dart';

final notificationsListProvider = FutureProvider(
  (ref) => ref.watch(notificationsRepositoryProvider).list(),
);

final unreadNotificationsProvider = FutureProvider(
  (ref) => ref.watch(notificationsRepositoryProvider).unreadCount(),
);

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(notificationsListProvider);
    final unreadCount = ref.watch(unreadNotificationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          unreadCount.when(
            data: (count) => Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Center(child: Text('Unread $count')),
            ),
            error: (_, _) => const SizedBox.shrink(),
            loading: () => const Padding(
              padding: EdgeInsets.all(16),
              child: SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
          ),
        ],
      ),
      body: items.when(
        data: (rows) => ListView.separated(
          padding: const EdgeInsets.all(16),
          itemBuilder: (_, index) {
            final item = rows[index];
            return Card(
              child: ListTile(
                title: Text(item.title),
                subtitle: Text(item.body),
                trailing: item.isRead
                    ? const Icon(Icons.done_all)
                    : const Icon(Icons.fiber_manual_record, size: 14),
              ),
            );
          },
          separatorBuilder: (_, _) => const SizedBox(height: 12),
          itemCount: rows.length,
        ),
        error: (error, _) => Center(child: Text(error.toString())),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}
