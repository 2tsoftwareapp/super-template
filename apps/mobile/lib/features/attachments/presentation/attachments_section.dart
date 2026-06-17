import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/widgets/async_screen_body.dart';
import 'package:mobile_app/core/widgets/state_views.dart';
import 'package:mobile_app/features/attachments/data/attachments_repository.dart';
import 'package:mobile_app/features/projects/data/projects_repository.dart';

final projectAttachmentsProvider = FutureProvider.family(
  (ref, String projectId) =>
      ref.watch(projectsRepositoryProvider).listAttachments(projectId),
);

class AttachmentsSection extends ConsumerWidget {
  const AttachmentsSection({required this.projectId, super.key});

  final String projectId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final attachments = ref.watch(projectAttachmentsProvider(projectId));
    final attachmentsRepo = ref.read(attachmentsRepositoryProvider);

    return AsyncScreenBody(
      value: attachments,
      isEmpty: (rows) => rows.isEmpty,
      empty: const CenterMessage(title: 'No attachments yet'),
      data: (rows) => ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: rows.length,
        separatorBuilder: (_, _) => const SizedBox(height: 8),
        itemBuilder: (_, index) {
          final attachment = rows[index];
          return Card(
            child: ListTile(
              title: Text(attachment.label ?? attachment.fileId),
              subtitle: Text(attachment.createdAt.toString()),
              trailing: IconButton(
                icon: const Icon(Icons.delete_outline),
                onPressed: () async {
                  await attachmentsRepo.delete(attachment.id);
                  ref.invalidate(projectAttachmentsProvider(projectId));
                },
              ),
            ),
          );
        },
      ),
    );
  }
}
