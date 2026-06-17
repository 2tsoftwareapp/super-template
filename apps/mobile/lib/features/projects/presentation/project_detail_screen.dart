import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/features/activities/presentation/activities_section.dart';
import 'package:mobile_app/features/attachments/presentation/attachments_section.dart';
import 'package:mobile_app/features/comments/presentation/comments_section.dart';
import 'package:mobile_app/features/invitations/presentation/invitations_section.dart';
import 'package:mobile_app/features/projects/data/projects_repository.dart';
import 'package:mobile_app/features/projects/domain/project_summary.dart';

final projectDetailProvider = FutureProvider.family<ProjectSummary, String>(
  (ref, String id) => ref.watch(projectsRepositoryProvider).getById(id),
);

class ProjectDetailScreen extends ConsumerWidget {
  const ProjectDetailScreen({required this.projectId, super.key});

  final String projectId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final project = ref.watch(projectDetailProvider(projectId));
    final repository = ref.read(projectsRepositoryProvider);

    return project.when(
      loading: () => Scaffold(
        appBar: AppBar(title: const Text('Project detail')),
        body: const Center(child: CircularProgressIndicator()),
      ),
      error: (error, _) => Scaffold(
        appBar: AppBar(title: const Text('Project detail')),
        body: Center(child: Text(error.toString())),
      ),
      data: (item) => DefaultTabController(
        length: 5,
        child: Scaffold(
          appBar: AppBar(
            title: Text(item.name),
            actions: [
              IconButton(
                onPressed: () => context.go('/projects/$projectId/edit'),
                icon: const Icon(Icons.edit),
              ),
              PopupMenuButton<String>(
                onSelected: (value) async {
                  if (value == 'delete') {
                    await repository.remove(projectId);
                    if (context.mounted) {
                      context.go('/projects');
                    }
                    return;
                  }
                  if (value == 'restore') {
                    await repository.restore(projectId);
                    ref.invalidate(projectDetailProvider(projectId));
                  }
                },
                itemBuilder: (context) => [
                  if (item.isDeleted)
                    const PopupMenuItem(
                      value: 'restore',
                      child: Text('Restore project'),
                    )
                  else
                    const PopupMenuItem(
                      value: 'delete',
                      child: Text('Delete project'),
                    ),
                ],
              ),
            ],
            bottom: const TabBar(
              isScrollable: true,
              tabs: [
                Tab(text: 'Overview'),
                Tab(text: 'Comments'),
                Tab(text: 'Invitations'),
                Tab(text: 'Activities'),
                Tab(text: 'Attachments'),
              ],
            ),
          ),
          body: TabBarView(
            children: [
              _OverviewTab(project: item),
              CommentsSection(projectId: projectId),
              InvitationsSection(projectId: projectId),
              ActivitiesSection(projectId: projectId),
              AttachmentsSection(projectId: projectId),
            ],
          ),
        ),
      ),
    );
  }
}

class _OverviewTab extends StatelessWidget {
  const _OverviewTab({required this.project});

  final ProjectSummary project;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                project.name,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 12),
              Text(project.status),
              if (project.isDeleted) ...[
                const SizedBox(height: 8),
                const Text('This project is deleted'),
              ],
              const SizedBox(height: 12),
              Text(project.description ?? 'No description available.'),
            ],
          ),
        ),
      ),
    );
  }
}
