import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/widgets/widgets.dart';
import 'package:mobile_app/features/attachments/data/attachments_repository.dart';
import 'package:mobile_app/features/projects/data/projects_repository.dart';

final projectAttachmentsProvider = FutureProvider.family(
  (ref, String projectId) =>
      ref.watch(projectsRepositoryProvider).listAttachments(projectId),
);

class AttachmentsSection extends ConsumerStatefulWidget {
  const AttachmentsSection({required this.projectId, super.key});

  final String projectId;

  @override
  ConsumerState<AttachmentsSection> createState() => _AttachmentsSectionState();
}

class _AttachmentsSectionState extends ConsumerState<AttachmentsSection> {
  bool _uploading = false;

  Future<void> _pickAndUpload() async {
    final result = await FilePicker.platform.pickFiles(withData: true);
    if (result == null || result.files.isEmpty) return;
    final file = result.files.first;
    if (file.bytes == null) return;

    setState(() => _uploading = true);
    try {
      final repo = ref.read(attachmentsRepositoryProvider);
      await repo.uploadAndAttach(
        bytes: file.bytes!,
        fileName: file.name,
        entityType: 'project',
        entityId: widget.projectId,
      );
      ref.invalidate(projectAttachmentsProvider(widget.projectId));
    } catch (e) {
      if (mounted) showErrorSnackBar(context, e);
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final attachments = ref.watch(projectAttachmentsProvider(widget.projectId));
    final attachmentsRepo = ref.read(attachmentsRepositoryProvider);

    return Stack(
      children: [
        AsyncScreenBody(
          value: attachments,
          isEmpty: (rows) => rows.isEmpty,
          empty: const CenterMessage(title: 'No attachments yet'),
          data: (rows) => ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
            itemCount: rows.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (_, index) {
              final attachment = rows[index];
              return Card(
                child: ListTile(
                  leading: const Icon(Icons.attach_file_rounded),
                  title: Text(attachment.label ?? attachment.fileId),
                  subtitle: Text(attachment.createdAt.toString()),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete_outline),
                    onPressed: () async {
                      try {
                        await attachmentsRepo.delete(attachment.id);
                        ref.invalidate(
                          projectAttachmentsProvider(widget.projectId),
                        );
                      } catch (e) {
                        if (context.mounted) showErrorSnackBar(context, e);
                      }
                    },
                  ),
                ),
              );
            },
          ),
        ),

        // ── Upload FAB ────────────────────────────────────────────────────
        Positioned(
          right: 16,
          bottom: 16,
          child: FloatingActionButton.extended(
            onPressed: _uploading ? null : _pickAndUpload,
            icon: _uploading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.upload_rounded),
            label: Text(_uploading ? 'Uploading…' : 'Upload file'),
          ),
        ),
      ],
    );
  }
}
