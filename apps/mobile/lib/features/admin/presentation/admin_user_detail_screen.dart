import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/features/admin/data/admin_repository.dart';
import 'package:mobile_app/features/auth/presentation/auth_controller.dart';

class AdminUserDetailScreen extends ConsumerStatefulWidget {
  const AdminUserDetailScreen({super.key, required this.userId});

  final String userId;

  @override
  ConsumerState<AdminUserDetailScreen> createState() =>
      _AdminUserDetailScreenState();
}

class _AdminUserDetailScreenState extends ConsumerState<AdminUserDetailScreen> {
  String? _status;
  Set<String> _selectedRoleIds = {};
  List<AdminRole> _allRoles = [];
  bool _rolesLoaded = false;

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

          if (!_rolesLoaded) {
            _rolesLoaded = true;
            repository.listRoles().then((roles) {
              if (!mounted) {
                return;
              }
              setState(() {
                _allRoles = roles;
                _selectedRoleIds = roles
                    .where((role) => user.roles.contains(role.name))
                    .map((role) => role.id)
                    .toSet();
              });
            });
          }

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
                Text('Roles', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                if (_allRoles.isEmpty)
                  const Text('Loading roles...')
                else
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _allRoles
                        .map(
                          (role) => FilterChip(
                            label: Text(role.name),
                            selected: _selectedRoleIds.contains(role.id),
                            onSelected: canUpdate
                                ? (selected) {
                                    setState(() {
                                      if (selected) {
                                        _selectedRoleIds.add(role.id);
                                      } else {
                                        _selectedRoleIds.remove(role.id);
                                      }
                                    });
                                  }
                                : null,
                          ),
                        )
                        .toList(),
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
                            await repository.replaceRoles(
                              id: widget.userId,
                              roleIds: _selectedRoleIds.toList(),
                            );
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
