import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/widgets/async_screen_body.dart';
import 'package:mobile_app/core/widgets/state_views.dart';
import 'package:mobile_app/features/invitations/data/invitations_repository.dart';

final projectInvitationsProvider = FutureProvider.family(
  (ref, String projectId) => ref
      .watch(invitationsRepositoryProvider)
      .list(entityType: 'project', entityId: projectId),
);

class InvitationsSection extends ConsumerStatefulWidget {
  const InvitationsSection({required this.projectId, super.key});

  final String projectId;

  @override
  ConsumerState<InvitationsSection> createState() => _InvitationsSectionState();
}

class _InvitationsSectionState extends ConsumerState<InvitationsSection> {
  final _emailController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final invitations = ref.watch(projectInvitationsProvider(widget.projectId));
    final repository = ref.read(invitationsRepositoryProvider);

    return Column(
      children: [
        Expanded(
          child: AsyncScreenBody(
            value: invitations,
            isEmpty: (rows) => rows.isEmpty,
            empty: const CenterMessage(title: 'No invitations yet'),
            data: (rows) => ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: rows.length,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (_, index) {
                final invitation = rows[index];
                return Card(
                  child: ListTile(
                    title: Text(invitation.email),
                    subtitle: Text(
                      '${invitation.status} · expires ${invitation.expiresAt}',
                    ),
                    trailing: invitation.status == 'PENDING'
                        ? IconButton(
                            icon: const Icon(Icons.close),
                            onPressed: () async {
                              await repository.revoke(invitation.id);
                              ref.invalidate(
                                projectInvitationsProvider(widget.projectId),
                              );
                            },
                          )
                        : null,
                  ),
                );
              },
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _emailController,
                  decoration: const InputDecoration(
                    labelText: 'Invite by email',
                  ),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton(
                onPressed: () async {
                  final email = _emailController.text.trim();
                  if (email.isEmpty) {
                    return;
                  }
                  await repository.create(
                    email: email,
                    entityType: 'project',
                    entityId: widget.projectId,
                  );
                  _emailController.clear();
                  ref.invalidate(projectInvitationsProvider(widget.projectId));
                },
                child: const Text('Invite'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
