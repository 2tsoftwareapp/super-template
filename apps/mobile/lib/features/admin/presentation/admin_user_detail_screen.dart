import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/features/admin/data/admin_repository.dart';
import 'package:mobile_app/features/auth/presentation/auth_controller.dart';

const _assignableRoles = ['ADMIN', 'USER'];

class AdminUserDetailScreen extends ConsumerStatefulWidget {
  const AdminUserDetailScreen({super.key, required this.userId});

  final String userId;

  @override
  ConsumerState<AdminUserDetailScreen> createState() =>
      _AdminUserDetailScreenState();
}

class _AdminUserDetailScreenState extends ConsumerState<AdminUserDetailScreen> {
  String? _status;
  String? _selectedRole;

  @override
  Widget build(BuildContext context) {
    final permissions =
        ref.watch(authControllerProvider).valueOrNull?.permissions ?? [];
    final canUpdate = permissions.contains('users.update');
    final canDelete = permissions.contains('users.delete');
    final repository = ref.read(adminRepositoryProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('User detail'),
        actions: [
          if (canDelete)
            IconButton(
              onPressed: () => _deleteUser(context),
              icon: const Icon(Icons.delete),
            ),
        ],
      ),
      body: FutureBuilder(
        future: repository.getUser(widget.userId),
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError || !snapshot.hasData) {
            return Center(
              child: Text(snapshot.error?.toString() ?? 'Not found'),
            );
          }
          final user = snapshot.data!;
          _status ??= user.status;
          _selectedRole ??=
              user.roles
                  .where((role) => _assignableRoles.contains(role))
                  .firstOrNull ??
              'USER';

          return Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.displayName,
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 8),
                Text(user.email),
                if (user.roles.contains('SUPER_ADMIN')) ...[
                  const SizedBox(height: 8),
                  const Chip(label: Text('SUPER_ADMIN')),
                ],
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  initialValue: _status,
                  items: const [
                    DropdownMenuItem(value: 'PENDING', child: Text('PENDING')),
                    DropdownMenuItem(value: 'ACTIVE', child: Text('ACTIVE')),
                    DropdownMenuItem(value: 'BLOCKED', child: Text('BLOCKED')),
                  ],
                  onChanged: canUpdate
                      ? (value) => setState(() => _status = value)
                      : null,
                ),
                const SizedBox(height: 16),
                Text('Role', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                if (user.roles.contains('SUPER_ADMIN'))
                  const Text('SUPER_ADMIN role cannot be changed here.')
                else
                  DropdownButtonFormField<String>(
                    initialValue: _selectedRole,
                    items: _assignableRoles
                        .map(
                          (role) =>
                              DropdownMenuItem(value: role, child: Text(role)),
                        )
                        .toList(),
                    onChanged: canUpdate
                        ? (value) => setState(() => _selectedRole = value)
                        : null,
                  ),
                const Spacer(),
                if (canUpdate)
                  FilledButton(
                    onPressed: _status == null
                        ? null
                        : () async {
                            await repository.updateStatus(
                              id: widget.userId,
                              status: _status!,
                            );
                            if (!user.roles.contains('SUPER_ADMIN') &&
                                _selectedRole != null) {
                              await repository.replaceRoles(
                                id: widget.userId,
                                role: _selectedRole!,
                              );
                            }
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('User updated')),
                              );
                            }
                          },
                    child: const Text('Save changes'),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _deleteUser(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete user'),
        content: const Text('This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) {
      return;
    }
    await ref.read(adminRepositoryProvider).deleteUser(widget.userId);
    if (context.mounted) {
      context.go('/admin/users');
    }
  }
}
