import 'package:built_value/json_object.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/errors/app_exception.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:mobile_app/features/projects/domain/project_attachment_summary.dart';
import 'package:mobile_app/features/projects/domain/project_summary.dart';
import 'package:super_template_api/super_template_api.dart';

final projectsRepositoryProvider = Provider<ProjectsRepository>(
  (ref) => ProjectsRepository(ref.watch(apiClientProvider)),
);

class ProjectsRepository {
  ProjectsRepository(this._client);

  final SuperTemplateApi _client;
  ProjectsApi get _api => _client.getProjectsApi();

  Future<List<ProjectSummary>> list() async {
    try {
      final response = await _api.projectsControllerList();
      return response.data!.data
          .map(
            (project) => ProjectSummary(
              id: project.id,
              name: project.name,
              status: project.status.name,
              description: _jsonObjectToString(project.description),
            ),
          )
          .toList();
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<ProjectSummary> getById(String id) async {
    try {
      final response = await _api.projectsControllerGetById(id: id);
      final project = response.data!.data;
      return ProjectSummary(
        id: project.id,
        name: project.name,
        status: project.status.name,
        description: _jsonObjectToString(project.description),
        isDeleted: project.deletedAt != null,
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<ProjectSummary> create({
    required String name,
    String? description,
    String status = 'DRAFT',
  }) async {
    try {
      final response = await _api.projectsControllerCreate(
        createProjectDto: CreateProjectDto(
          (b) => b
            ..name = name
            ..description = description
            ..status = CreateProjectDtoStatusEnum.valueOf(status),
        ),
      );
      final project = response.data!.data;
      return ProjectSummary(
        id: project.id,
        name: project.name,
        status: project.status.name,
        description: _jsonObjectToString(project.description),
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<ProjectSummary> update({
    required String id,
    required String name,
    String? description,
    String status = 'DRAFT',
  }) async {
    try {
      final response = await _api.projectsControllerUpdate(
        id: id,
        updateProjectDto: UpdateProjectDto(
          (b) => b
            ..name = name
            ..description = description
            ..status = UpdateProjectDtoStatusEnum.valueOf(status),
        ),
      );
      final project = response.data!.data;
      return ProjectSummary(
        id: project.id,
        name: project.name,
        status: project.status.name,
        description: _jsonObjectToString(project.description),
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  String? _jsonObjectToString(JsonObject? value) {
    final raw = value?.value;
    return raw is String ? raw : null;
  }

  Future<void> remove(String id) async {
    try {
      await _api.projectsControllerRemove(id: id);
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<ProjectSummary> restore(String id) async {
    try {
      final response = await _api.projectsControllerRestore(id: id);
      final project = response.data!.data;
      return ProjectSummary(
        id: project.id,
        name: project.name,
        status: project.status.name,
        description: _jsonObjectToString(project.description),
        isDeleted: project.deletedAt != null,
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<List<ProjectAttachmentSummary>> listAttachments(String id) async {
    try {
      final response = await _api.projectsControllerListAttachments(id: id);
      return response.data!.data
          .map(
            (item) => ProjectAttachmentSummary(
              id: item.id,
              fileId: item.fileId,
              label: _jsonObjectToString(item.label),
              createdAt: DateTime.parse(item.createdAt),
            ),
          )
          .toList();
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }
}
