import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/core/widgets/widgets.dart';
import 'package:mobile_app/features/admin/data/admin_repository.dart';
import 'package:mobile_app/features/auth/presentation/auth_controller.dart';

const _assignableRoles = ['ADMIN', 'USER'];

/// Cached provider so the future isn't re-created on every build.
final adminUserDetailProvider = FutureProvider.autoDispose.family(
  (ref, String userId) => ref.read(adminRepositoryProvider).getUser(userId),
);

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

    return Scaffold(
      appBar: AppBar(
        title: const Text('User detail'),
        actions: [
          if (canDelete)
            IconButton(
              onPressed: () => _deleteUser(context),
              icon: const Icon(Icons.delete_outline),
            ),
        ],
      ),
      body: ref
          .watch(adminUserDetailProvider(widget.userId))
          .when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => Center(child: Text(error.toString())),
            data: (user) {
              _status ??= user.status;
              _selectedRole ??=
                  user.roles
                      .where((r) => _assignableRoles.contains(r))
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
                    const SizedBox(height: 4),
                    Text(user.email),
                    if (user.roles.contains('SUPER_ADMIN')) ...[
                      const SizedBox(height: 8),
                      const Chip(label: Text('SUPER_ADMIN')),
                    ],
                    const SizedBox(height: 24),
                    Text(
                      'Status',
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      initialValue: _status,
                      items: const [
                        DropdownMenuItem(
                          value: 'PENDING',
                          child: Text('PENDING'),
                        ),
                        DropdownMenuItem(
                          value: 'ACTIVE',
                          child: Text('ACTIVE'),
                        ),
                        DropdownMenuItem(
                          value: 'BLOCKED',
                          child: Text('BLOCKED'),
                        ),
                      ],
                      onChanged: canUpdate
                          ? (value) => setState(() => _status = value)
                          : null,
                    ),
                    const SizedBox(height: 16),
                    Text('Role', style: Theme.of(context).textTheme.titleSmall),
                    const SizedBox(height: 8),
                    if (user.roles.contains('SUPER_ADMIN'))
                      const Text('SUPER_ADMIN role cannot be changed here.')
                    else
                      DropdownButtonFormField<String>(
                        initialValue: _selectedRole,
                        items: _assignableRoles
                            .map(
                              (role) => DropdownMenuItem(
                                value: role,
                                child: Text(role),
                              ),
                            )
                            .toList(),
                        onChanged: canUpdate
                            ? (value) => setState(() => _selectedRole = value)
                            : null,
                      ),
                    const Spacer(),
                    if (canUpdate)
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: _status == null ? null : () => _save(user),
                          child: const Text('Save changes'),
                        ),
                      ),
                  ],
                ),
              );
            },
          ),
    );
  }

  Future<void> _save(dynamic user) async {
    final repository = ref.read(adminRepositoryProvider);
    try {
      await repository.updateStatus(id: widget.userId, status: _status!);
      if (!user.roles.contains('SUPER_ADMIN') && _selectedRole != null) {
        await repository.replaceRoles(id: widget.userId, role: _selectedRole!);
      }
      // Refresh the provider so next open has fresh data.
      ref.invalidate(adminUserDetailProvider(widget.userId));
      if (mounted) showSuccessSnackBar(context, 'User updated');
    } catch (e) {
      if (mounted) showErrorSnackBar(context, e);
    }
  }

  Future<void> _deleteUser(BuildContext context) async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Delete user',
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    );
    if (!confirmed || !context.mounted) return;
    try {
      await ref.read(adminRepositoryProvider).deleteUser(widget.userId);
      if (context.mounted) context.pop();
    } catch (e) {
      if (context.mounted) showErrorSnackBar(context, e);
    }
  }
}
