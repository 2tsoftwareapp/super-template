import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:built_value/json_object.dart';
import 'package:mobile_app/features/auth/data/auth_repository.dart';

final sessionsProvider = FutureProvider(
  (ref) => ref.watch(authRepositoryProvider).sessions(),
);

class SessionsScreen extends ConsumerWidget {
  const SessionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessions = ref.watch(sessionsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Active sessions')),
      body: sessions.when(
        data: (rows) => ListView.separated(
          padding: const EdgeInsets.all(16),
          itemBuilder: (_, index) {
            final session = rows[index];
            return Card(
              child: ListTile(
                title: Text(
                  _jsonObjectToString(session.userAgent) ?? 'Unknown device',
                ),
                subtitle: Text(
                  _jsonObjectToString(session.ipAddress) ?? 'Unknown IP',
                ),
                trailing: session.current == true
                    ? const Text('Current')
                    : TextButton(
                        onPressed: () async {
                          await ref
                              .read(authRepositoryProvider)
                              .revokeSession(session.id);
                          ref.invalidate(sessionsProvider);
                        },
                        child: const Text('Revoke'),
                      ),
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

  String? _jsonObjectToString(JsonObject? value) {
    final raw = value?.value;
    return raw is String ? raw : null;
  }
}
