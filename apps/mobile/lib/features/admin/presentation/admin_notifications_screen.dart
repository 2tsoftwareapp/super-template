import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/features/admin/data/admin_repository.dart';
import 'package:mobile_app/features/auth/presentation/auth_controller.dart';
import 'package:super_template_api/super_template_api.dart';

class AdminNotificationsScreen extends ConsumerStatefulWidget {
  const AdminNotificationsScreen({super.key});

  @override
  ConsumerState<AdminNotificationsScreen> createState() =>
      _AdminNotificationsScreenState();
}

class _AdminNotificationsScreenState
    extends ConsumerState<AdminNotificationsScreen> {
  final _titleController = TextEditingController();
  final _bodyController = TextEditingController();
  int _refreshKey = 0;

  @override
  void dispose() {
    _titleController.dispose();
    _bodyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final permissions =
        ref.watch(authControllerProvider).valueOrNull?.permissions ?? [];
    final canSend = permissions.contains('notifications.send');

    if (!canSend) {
      return Scaffold(
        appBar: AppBar(title: const Text('Admin notifications')),
        body: const Center(
          child: Text('Missing notifications.send permission'),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin notifications'),
        actions: [
          IconButton(
            onPressed: () => setState(() => _refreshKey++),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _sendNotification(context),
        child: const Icon(Icons.send),
      ),
      body: FutureBuilder(
        key: ValueKey(_refreshKey),
        future: ref.read(adminRepositoryProvider).listNotificationJobs(),
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text(snapshot.error.toString()));
          }
          final jobs = snapshot.data ?? [];
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: jobs.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final job = jobs[index];
              return ListTile(
                title: Text(job.title),
                subtitle: Text(
                  '${job.audience} · ${job.status} · ${job.scheduledAt}',
                ),
                trailing: job.status != 'CANCELLED'
                    ? IconButton(
                        icon: const Icon(Icons.cancel),
                        onPressed: () async {
                          await ref
                              .read(adminRepositoryProvider)
                              .cancelNotificationJob(job.id);
                          if (context.mounted) {
                            setState(() => _refreshKey++);
                          }
                        },
                      )
                    : null,
              );
            },
          );
        },
      ),
    );
  }

  Future<void> _sendNotification(BuildContext context) async {
    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Send notification'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _titleController,
              decoration: const InputDecoration(labelText: 'Title'),
            ),
            TextField(
              controller: _bodyController,
              decoration: const InputDecoration(labelText: 'Body'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              await ref
                  .read(adminRepositoryProvider)
                  .sendAdminNotification(
                    request: SendNotificationRequestDto(
                      (b) => b
                        ..audience = SendNotificationRequestDtoAudienceEnum.ALL
                        ..type = 'admin.broadcast'
                        ..title = _titleController.text.trim()
                        ..body = _bodyController.text.trim(),
                    ),
                  );
              if (context.mounted) {
                Navigator.pop(context);
                setState(() => _refreshKey++);
              }
            },
            child: const Text('Send'),
          ),
        ],
      ),
    );
  }
}
