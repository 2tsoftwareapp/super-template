import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/features/admin/data/admin_repository.dart';

class AdminUserDetailScreen extends ConsumerStatefulWidget {
  const AdminUserDetailScreen({super.key, required this.userId});

  final String userId;

  @override
  ConsumerState<AdminUserDetailScreen> createState() =>
      _AdminUserDetailScreenState();
}

class _AdminUserDetailScreenState extends ConsumerState<AdminUserDetailScreen> {
  String? _status;

  @override
  Widget build(BuildContext context) {
    final repository = ref.read(adminRepositoryProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('User detail')),
      body: FutureBuilder(
        future: repository.getUser(widget.userId),
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError || !snapshot.hasData) {
            return Center(child: Text(snapshot.error?.toString() ?? 'Not found'));
          }
          final user = snapshot.data!;
          _status ??= user.status;

          return Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(user.displayName, style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 8),
                Text(user.email),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _status,
                  items: const [
                    DropdownMenuItem(value: 'PENDING', child: Text('PENDING')),
                    DropdownMenuItem(value: 'ACTIVE', child: Text('ACTIVE')),
                    DropdownMenuItem(value: 'BLOCKED', child: Text('BLOCKED')),
                  ],
                  onChanged: (value) => setState(() => _status = value),
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _status == null
                      ? null
                      : () async {
                          await repository.updateStatus(
                            id: widget.userId,
                            status: _status!,
                          );
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Status updated')),
                            );
                          }
                        },
                  child: const Text('Save status'),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
