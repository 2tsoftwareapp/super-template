import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/core/design/app_colors.dart';
import 'package:mobile_app/core/design/app_spacing.dart';
import 'package:mobile_app/core/widgets/widgets.dart';
import 'package:mobile_app/features/projects/data/projects_repository.dart';

final projectsListProvider = FutureProvider(
  (ref) => ref.watch(projectsRepositoryProvider).list(),
);

class ProjectsScreen extends ConsumerWidget {
  const ProjectsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projects = ref.watch(projectsListProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Projects'),
        actions: [
          IconButton(
            onPressed: () async {
              final created = await context.push<bool>('/projects/new');
              if (created == true) {
                ref.invalidate(projectsListProvider);
              }
            },
            icon: const Icon(Icons.add),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(projectsListProvider.future),
        child: AsyncScreenBody(
          value: projects,
          isEmpty: (items) => items.isEmpty,
          empty: const CenterMessage(
            icon: Icons.folder_open_rounded,
            title: 'No projects yet',
            body: 'Create your first project to get started.',
          ),
          data: (items) => ListView.separated(
            padding: const EdgeInsets.all(AppSpacing.base),
            itemCount: items.length,
            separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.md),
            itemBuilder: (_, index) {
              final project = items[index];
              return AppListTile(
                icon: Icons.folder_rounded,
                iconColor: AppColors.cardProjects,
                title: project.name,
                subtitle: project.description?.isNotEmpty == true
                    ? project.description
                    : null,
                trailing: AppBadge.status(project.status),
                onTap: () => context.push('/projects/${project.id}'),
              );
            },
          ),
        ),
      ),
    );
  }
}
