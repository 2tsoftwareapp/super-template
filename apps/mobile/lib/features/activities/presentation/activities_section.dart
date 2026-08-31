import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/widgets/async_screen_body.dart';
import 'package:mobile_app/core/widgets/state_views.dart';
import 'package:mobile_app/features/activities/data/activities_repository.dart';

final organizationActivitiesProvider = FutureProvider.family(
  (ref, String organizationId) => ref
      .watch(activitiesRepositoryProvider)
      .list(entityType: 'organization', entityId: organizationId),
);

class ActivitiesSection extends ConsumerWidget {
  const ActivitiesSection({required this.organizationId, super.key});

  final String organizationId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activities = ref.watch(
      organizationActivitiesProvider(organizationId),
    );

    return AsyncScreenBody(
      value: activities,
      isEmpty: (rows) => rows.isEmpty,
      empty: const CenterMessage(title: 'No activity yet'),
      data: (rows) => ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        padding: EdgeInsets.zero,
        itemCount: rows.length,
        separatorBuilder: (_, _) => const SizedBox(height: 8),
        itemBuilder: (_, index) {
          final activity = rows[index];
          return Card(
            child: ListTile(
              title: Text(activity.summary),
              subtitle: Text(
                '${activity.actorId ?? 'System'} · ${activity.createdAt}',
              ),
            ),
          );
        },
      ),
    );
  }
}
