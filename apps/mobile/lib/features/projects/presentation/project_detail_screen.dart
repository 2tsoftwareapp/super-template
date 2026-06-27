import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/core/design/app_colors.dart';
import 'package:mobile_app/core/design/app_radius.dart';
import 'package:mobile_app/core/design/app_spacing.dart';
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
          backgroundColor: Theme.of(context).brightness == Brightness.dark
              ? AppColors.backgroundDark
              : AppColors.backgroundLight,
          appBar: AppBar(
            title: Text(item.name),
            actions: [
              IconButton(
                onPressed: () async {
                  final updated = await context.push<bool>(
                    '/projects/$projectId/edit',
                  );
                  if (updated == true) {
                    ref.invalidate(projectDetailProvider(projectId));
                  }
                },
                icon: const Icon(Icons.edit),
              ),
              PopupMenuButton<String>(
                onSelected: (value) async {
                  if (value == 'delete') {
                    await repository.remove(projectId);
                    if (context.mounted) {
                      context.pop();
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

  static const _statusMeta = {
    'DRAFT': (
      label: 'Draft',
      icon: Icons.edit_note_rounded,
      color: Color(0xFF6B7280),
    ),
    'ACTIVE': (
      label: 'Active',
      icon: Icons.play_circle_rounded,
      color: Color(0xFF10B981),
    ),
    'ARCHIVED': (
      label: 'Archived',
      icon: Icons.archive_rounded,
      color: Color(0xFFF59E0B),
    ),
  };

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final meta =
        _statusMeta[project.status] ??
        (label: project.status, icon: Icons.circle_outlined, color: cs.primary);

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.base),
      children: [
        // ── Status badge + deleted warning ──────────────────────────────
        if (project.isDeleted)
          Container(
            margin: const EdgeInsets.only(bottom: AppSpacing.md),
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.base,
              vertical: AppSpacing.sm,
            ),
            decoration: BoxDecoration(
              color: cs.errorContainer,
              borderRadius: AppRadius.mdR,
            ),
            child: Row(
              children: [
                Icon(
                  Icons.warning_amber_rounded,
                  size: 18,
                  color: cs.onErrorContainer,
                ),
                const SizedBox(width: AppSpacing.sm),
                Text(
                  'This project has been deleted.',
                  style: tt.bodySmall?.copyWith(color: cs.onErrorContainer),
                ),
              ],
            ),
          ),

        // ── Info card ────────────────────────────────────────────────────
        Container(
          padding: const EdgeInsets.all(AppSpacing.base),
          decoration: BoxDecoration(
            color: isDark
                ? AppColors.surfaceContainerDark
                : AppColors.surfaceLight,
            borderRadius: AppRadius.lgR,
            border: Border.all(
              color: isDark
                  ? AppColors.outlineVariantDark
                  : AppColors.outlineVariantLight,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Status row
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.sm,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: meta.color.withValues(alpha: 0.12),
                      borderRadius: AppRadius.fullR,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(meta.icon, size: 14, color: meta.color),
                        const SizedBox(width: 4),
                        Text(
                          meta.label,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: meta.color,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: AppSpacing.md),
              const Divider(height: 1),
              const SizedBox(height: AppSpacing.md),

              // Description
              Text(
                'Description',
                style: tt.labelSmall?.copyWith(
                  color: cs.onSurfaceVariant,
                  letterSpacing: 0.8,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                project.description?.isNotEmpty == true
                    ? project.description!
                    : 'No description provided.',
                style: tt.bodyMedium?.copyWith(
                  color: project.description?.isNotEmpty == true
                      ? null
                      : cs.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: AppSpacing.md),

        // ── Quick stats ───────────────────────────────────────────────────
        Row(
          children: [
            _StatCard(
              label: 'Status',
              value: meta.label,
              icon: meta.icon,
              color: meta.color,
              isDark: isDark,
            ),
          ],
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.isDark,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;

    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: isDark
              ? AppColors.surfaceContainerDark
              : AppColors.surfaceLight,
          borderRadius: AppRadius.mdR,
          border: Border.all(
            color: isDark
                ? AppColors.outlineVariantDark
                : AppColors.outlineVariantLight,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: AppRadius.smR,
              ),
              child: Icon(icon, size: 18, color: color),
            ),
            const SizedBox(width: AppSpacing.sm),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: tt.labelSmall?.copyWith(color: cs.onSurfaceVariant),
                ),
                Text(
                  value,
                  style: tt.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
