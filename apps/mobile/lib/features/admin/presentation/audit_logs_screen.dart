import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/features/admin/data/admin_repository.dart';
import 'package:mobile_app/features/auth/presentation/auth_controller.dart';

class AuditLogsScreen extends ConsumerWidget {
  const AuditLogsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider).valueOrNull;
    final canRead = auth?.permissions.contains('audit.read') ?? false;

    if (!canRead) {
      return Scaffold(
        appBar: AppBar(title: const Text('Audit logs')),
        body: const Center(child: Text('Missing audit.read permission')),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Audit logs')),
      body: FutureBuilder(
        future: ref.read(adminRepositoryProvider).listAuditLogs(),
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text(snapshot.error.toString()));
          }
          final logs = snapshot.data ?? [];
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: logs.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final log = logs[index];
              return ListTile(
                title: Text(log.action),
                subtitle: Text(
                  '${log.entityType} · ${log.createdAt.toLocal()}',
                ),
                trailing: Text(
                  log.actorId != null
                      ? log.actorId!.substring(
                          0,
                          log.actorId!.length < 8 ? log.actorId!.length : 8,
                        )
                      : 'system',
                ),
              );
            },
          );
        },
      ),
    );
  }
}
