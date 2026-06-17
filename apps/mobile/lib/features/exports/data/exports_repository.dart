import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/errors/app_exception.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:super_template_api/super_template_api.dart';

final exportsRepositoryProvider = Provider<ExportsRepository>(
  (ref) => ExportsRepository(ref.watch(apiClientProvider)),
);

class ExportJobSummary {
  const ExportJobSummary({
    required this.id,
    required this.type,
    required this.status,
    required this.fileId,
  });

  final String id;
  final String type;
  final String status;
  final String? fileId;
}

class ExportsRepository {
  ExportsRepository(this._client);

  final SuperTemplateApi _client;

  ExportsApi get _api => _client.getExportsApi();
  FilesApi get _filesApi => _client.getFilesApi();

  Future<ExportJobSummary> create({
    required String type,
    required String idempotencyKey,
  }) async {
    try {
      final response = await _client.dio.post<Map<String, dynamic>>(
        '/api/v1/exports',
        data: {'type': type, 'idempotencyKey': idempotencyKey},
      );
      return _parseJob(response.data!);
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<ExportJobSummary> getById(String id) async {
    try {
      final response = await _api.exportsControllerGetById(id: id);
      return _fromDto(response.data!.data);
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<String> getFileUrl(String fileId) async {
    try {
      final response = await _filesApi.filesControllerGetUrl(id: fileId);
      return response.data!.data.url;
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  ExportJobSummary _parseJob(Map<String, dynamic> body) {
    final data = body['data'] as Map<String, dynamic>;
    return ExportJobSummary(
      id: data['id'] as String,
      type: data['type'] as String,
      status: data['status'] as String,
      fileId: data['fileId'] as String?,
    );
  }

  ExportJobSummary _fromDto(ExportJobDto job) {
    return ExportJobSummary(
      id: job.id,
      type: job.type,
      status: job.status.name,
      fileId: job.fileId?.value as String?,
    );
  }
}
