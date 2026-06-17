import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/widgets/async_screen_body.dart';
import 'package:mobile_app/core/widgets/state_views.dart';
import 'package:mobile_app/features/comments/data/comments_repository.dart';

final projectCommentsProvider = FutureProvider.family(
  (ref, String projectId) => ref
      .watch(commentsRepositoryProvider)
      .list(entityType: 'project', entityId: projectId),
);

class CommentsSection extends ConsumerStatefulWidget {
  const CommentsSection({required this.projectId, super.key});

  final String projectId;

  @override
  ConsumerState<CommentsSection> createState() => _CommentsSectionState();
}

class _CommentsSectionState extends ConsumerState<CommentsSection> {
  final _contentController = TextEditingController();

  @override
  void dispose() {
    _contentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final comments = ref.watch(projectCommentsProvider(widget.projectId));
    final repository = ref.read(commentsRepositoryProvider);

    return Column(
      children: [
        Expanded(
          child: AsyncScreenBody(
            value: comments,
            isEmpty: (rows) => rows.isEmpty,
            empty: const CenterMessage(title: 'No comments yet'),
            data: (rows) => ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: rows.length,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (_, index) {
                final comment = rows[index];
                return Card(
                  child: ListTile(
                    title: Text(comment.content),
                    subtitle: Text(comment.authorId),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete_outline),
                      onPressed: () async {
                        await repository.delete(comment.id);
                        ref.invalidate(
                          projectCommentsProvider(widget.projectId),
                        );
                      },
                    ),
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
                  controller: _contentController,
                  decoration: const InputDecoration(hintText: 'Add a comment'),
                ),
              ),
              IconButton(
                onPressed: () async {
                  final content = _contentController.text.trim();
                  if (content.isEmpty) {
                    return;
                  }
                  await repository.create(
                    entityType: 'project',
                    entityId: widget.projectId,
                    content: content,
                  );
                  _contentController.clear();
                  ref.invalidate(projectCommentsProvider(widget.projectId));
                },
                icon: const Icon(Icons.send),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
