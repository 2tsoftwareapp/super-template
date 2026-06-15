import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/core/widgets/state_views.dart';
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
            onPressed: () => context.go('/projects/new'),
            icon: const Icon(Icons.add),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(projectsListProvider.future),
        child: projects.when(
          data: (items) => items.isEmpty
              ? ListView(
                  children: const [
                    SizedBox(height: 220),
                    CenterMessage(title: 'No projects yet'),
                  ],
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemBuilder: (_, index) {
                    final project = items[index];
                    return Card(
                      child: ListTile(
                        title: Text(project.name),
                        subtitle: Text(project.description ?? project.status),
                        onTap: () => context.go('/projects/${project.id}'),
                      ),
                    );
                  },
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemCount: items.length,
                ),
          error: (error, _) => ListView(
            children: [
              const SizedBox(height: 200),
              CenterMessage(
                title: 'Could not load projects',
                body: error.toString(),
                action: FilledButton(
                  onPressed: () => ref.invalidate(projectsListProvider),
                  child: const Text('Retry'),
                ),
              ),
            ],
          ),
          loading: () => const Center(child: CircularProgressIndicator()),
        ),
      ),
    );
  }
}
