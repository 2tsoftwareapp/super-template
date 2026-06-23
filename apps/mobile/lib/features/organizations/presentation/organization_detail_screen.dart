import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/core/widgets/async_screen_body.dart';
import 'package:mobile_app/core/widgets/state_views.dart';
import 'package:mobile_app/features/auth/presentation/auth_controller.dart';
import 'package:mobile_app/features/organizations/data/organizations_repository.dart';

final organizationDetailProvider =
    FutureProvider.family<OrganizationDetail, String>(
  (ref, id) => ref.watch(organizationsRepositoryProvider).getDetail(id),
);

final organizationMembersProvider =
    FutureProvider.family<List<OrganizationMember>, String>(
  (ref, id) => ref.watch(organizationsRepositoryProvider).listMembers(id),
);

class OrganizationDetailScreen extends ConsumerStatefulWidget {
  const OrganizationDetailScreen({required this.organizationId, super.key});

  final String organizationId;

  @override
  ConsumerState<OrganizationDetailScreen> createState() =>
      _OrganizationDetailScreenState();
}

class _OrganizationDetailScreenState
    extends ConsumerState<OrganizationDetailScreen> {
  final _editController = TextEditingController();

  @override
  void dispose() {
    _editController.dispose();
    super.dispose();
  }

  Future<void> _editName(OrganizationDetail detail) async {
    _editController.text = detail.name;
    final name = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Edit organization name'),
        content: TextField(
          controller: _editController,
          decoration: const InputDecoration(labelText: 'Name'),
          autofocus: true,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(_editController.text.trim()),
            child: const Text('Save'),
          ),
        ],
      ),
    );
    if (name != null && name.isNotEmpty && name != detail.name) {
      await ref.read(organizationsRepositoryProvider).update(
            id: widget.organizationId,
            name: name,
          );
      ref.invalidate(organizationDetailProvider(widget.organizationId));
      ref.invalidate(organizationsListProvider);
    }
  }

  Future<void> _leave() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Leave organization'),
        content:
            const Text('Are you sure you want to leave this organization?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Leave'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await ref.read(organizationsRepositoryProvider).leave(
            widget.organizationId,
          );
      ref.invalidate(organizationsListProvider);
      if (context.mounted) context.go('/organizations');
    }
  }

  Future<void> _delete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete organization'),
        content: const Text(
          'This action cannot be undone. All data will be lost.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(ctx).colorScheme.error,
            ),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await ref.read(organizationsRepositoryProvider).delete(
            widget.organizationId,
          );
      ref.invalidate(organizationsListProvider);
      if (context.mounted) context.go('/organizations');
    }
  }

  @override
  Widget build(BuildContext context) {
    final detailAsync = ref.watch(organizationDetailProvider(widget.organizationId));
    final membersAsync = ref.watch(organizationMembersProvider(widget.organizationId));
    final auth = ref.watch(authControllerProvider).valueOrNull;
    final repo = ref.read(organizationsRepositoryProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Organization')),
      body: AsyncScreenBody(
        value: detailAsync,
        data: (detail) {
          final isOwner = detail.role == 'OWNER';
          final isAdmin = isOwner || detail.role == 'ADMIN';
          final canDelete = isOwner;

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              detail.name,
                              style:
                                  Theme.of(context).textTheme.headlineSmall,
                            ),
                          ),
                          if (isAdmin)
                            IconButton(
                              icon: const Icon(Icons.edit),
                              onPressed: () => _editName(detail),
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(detail.slug,
                          style: Theme.of(context).textTheme.bodyMedium),
                      const SizedBox(height: 4),
                      Text('Role: ${detail.role}'),
                      Text('Members: ${detail.memberCount}'),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text('Members',
                  style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              AsyncScreenBody(
                value: membersAsync,
                isEmpty: (list) => list.isEmpty,
                empty: const CenterMessage(title: 'No members'),
                data: (members) => Column(
                  children: members
                      .map(
                        (m) => _MemberTile(
                          member: m,
                          currentUserId: auth?.userId ?? '',
                          isOwner: isOwner,
                          isAdmin: isAdmin,
                          onRoleChanged: (role) async {
                            await repo.updateMemberRole(
                              organizationId: widget.organizationId,
                              userId: m.userId,
                              role: role,
                            );
                            ref.invalidate(
                                organizationMembersProvider(widget.organizationId));
                          },
                          onRemove: () async {
                            await repo.removeMember(
                              organizationId: widget.organizationId,
                              userId: m.userId,
                            );
                            ref.invalidate(
                                organizationMembersProvider(widget.organizationId));
                          },
                        ),
                      )
                      .toList(),
                ),
              ),
              if (detail.role != 'OWNER') ...[
                const SizedBox(height: 24),
                OutlinedButton(
                  onPressed: _leave,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Theme.of(context).colorScheme.error,
                  ),
                  child: const Text('Leave organization'),
                ),
              ],
              if (canDelete) ...[
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: _delete,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Theme.of(context).colorScheme.error,
                  ),
                  child: const Text('Delete organization'),
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _MemberTile extends StatelessWidget {
  const _MemberTile({
    required this.member,
    required this.currentUserId,
    required this.isOwner,
    required this.isAdmin,
    required this.onRoleChanged,
    required this.onRemove,
  });

  final OrganizationMember member;
  final String currentUserId;
  final bool isOwner;
  final bool isAdmin;
  final void Function(String role) onRoleChanged;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final isSelf = member.userId == currentUserId;
    final canChangeRole = isOwner || (isAdmin && member.role != 'OWNER');
    final canRemove = !isSelf && (isOwner || (isAdmin && member.role != 'OWNER'));

    return Card(
      child: ListTile(
        title: Text(member.displayName),
        subtitle: Text('${member.email} · ${member.role}'),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (canChangeRole)
              PopupMenuButton<String>(
                onSelected: onRoleChanged,
                itemBuilder: (_) => [
                  if (isOwner) ...[
                    const PopupMenuItem(
                      value: 'OWNER',
                      child: Text('Set as OWNER'),
                    ),
                    const PopupMenuItem(
                      value: 'ADMIN',
                      child: Text('Set as ADMIN'),
                    ),
                  ],
                  const PopupMenuItem(
                    value: 'MEMBER',
                    child: Text('Set as MEMBER'),
                  ),
                ],
                icon: const Icon(Icons.swap_horiz),
              ),
            if (canRemove)
              IconButton(
                icon: const Icon(Icons.remove_circle_outline),
                onPressed: () async {
                  final confirmed = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      title: const Text('Remove member'),
                      content: Text(
                        'Remove ${member.displayName} from this organization?',
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.of(ctx).pop(false),
                          child: const Text('Cancel'),
                        ),
                        FilledButton(
                          onPressed: () => Navigator.of(ctx).pop(true),
                          child: const Text('Remove'),
                        ),
                      ],
                    ),
                  );
                  if (confirmed == true) onRemove();
                },
              ),
          ],
        ),
      ),
    );
  }
}
