import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/errors/app_exception.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:mobile_app/features/activities/domain/activity_summary.dart';
import 'package:super_template_api/super_template_api.dart';

final activitiesRepositoryProvider = Provider<ActivitiesRepository>(
  (ref) => ActivitiesRepository(ref.watch(apiClientProvider)),
);

class ActivitiesRepository {
  ActivitiesRepository(this._client);

  final SuperTemplateApi _client;
  ActivitiesApi get _api => _client.getActivitiesApi();

  Future<List<ActivitySummary>> list({
    String? entityType,
    String? entityId,
  }) async {
    try {
      final response = await _api.activitiesControllerList(
        entityType: entityType,
        entityId: entityId,
      );
      return response.data!.data
          .map(
            (activity) => ActivitySummary(
              id: activity.id,
              summary: activity.summary,
              actorId: activity.actorId,
              createdAt: DateTime.parse(activity.createdAt),
            ),
          )
          .toList();
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }
}
