import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/widgets/widgets.dart';
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
    final repository = ref.read(notificationsRepositoryProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          unreadCount.when(
            data: (count) => count > 0
                ? TextButton(
                    onPressed: () async {
                      try {
                        await repository.markAllRead();
                        ref
                          ..invalidate(notificationsListProvider)
                          ..invalidate(unreadNotificationsProvider);
                      } catch (e) {
                        if (context.mounted) showErrorSnackBar(context, e);
                      }
                    },
                    child: Text('Mark all ($count)'),
                  )
                : const SizedBox.shrink(),
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
      body: AsyncScreenBody(
        value: items,
        isEmpty: (rows) => rows.isEmpty,
        empty: const CenterMessage(title: 'No notifications yet'),
        data: (rows) => ListView.separated(
          padding: const EdgeInsets.all(16),
          itemBuilder: (_, index) {
            final item = rows[index];
            return Dismissible(
              key: ValueKey(item.id),
              direction: DismissDirection.endToStart,
              background: Container(
                alignment: Alignment.centerRight,
                padding: const EdgeInsets.only(right: 20),
                color: Theme.of(context).colorScheme.error,
                child: const Icon(Icons.delete, color: Colors.white),
              ),
              onDismissed: (_) async {
                try {
                  await repository.delete(item.id);
                  ref
                    ..invalidate(notificationsListProvider)
                    ..invalidate(unreadNotificationsProvider);
                } catch (e) {
                  if (context.mounted) showErrorSnackBar(context, e);
                }
              },
              child: Card(
                child: ListTile(
                  title: Text(item.title),
                  subtitle: Text(item.body),
                  trailing: item.isRead
                      ? const Icon(Icons.done_all)
                      : const Icon(Icons.fiber_manual_record, size: 14),
                  onTap: () async {
                    if (!item.isRead) {
                      await repository.markRead(item.id);
                      ref
                        ..invalidate(notificationsListProvider)
                        ..invalidate(unreadNotificationsProvider);
                    }
                  },
                ),
              ),
            );
          },
          separatorBuilder: (_, _) => const SizedBox(height: 12),
          itemCount: rows.length,
        ),
      ),
    );
  }
}
