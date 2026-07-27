import 'package:built_value/json_object.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/errors/app_exception.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:super_template_api/super_template_api.dart';

final importsRepositoryProvider = Provider<ImportsRepository>(
  (ref) => ImportsRepository(ref.watch(apiClientProvider)),
);

class ImportJobSummary {
  const ImportJobSummary({
    required this.id,
    required this.type,
    required this.fileId,
    required this.status,
    required this.rowCount,
    required this.successCount,
    required this.errorCount,
  });

  final String id;
  final String type;
  final String fileId;
  final String status;
  final int? rowCount;
  final int? successCount;
  final int? errorCount;
}

class ImportsRepository {
  ImportsRepository(this._client);

  final SuperTemplateApi _client;

  ImportsApi get _api => _client.getImportsApi();
  FilesApi get _filesApi => _client.getFilesApi();

  Future<String> uploadFile(String path, String filename) async {
    try {
      final response = await _filesApi.filesControllerUpload(
        file: await MultipartFile.fromFile(path, filename: filename),
      );
      return response.data!.data.id;
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<ImportJobSummary> create({
    required CreateImportDtoTypeEnum type,
    required String fileId,
    required String idempotencyKey,
  }) async {
    try {
      final response = await _api.importsControllerCreate(
        createImportDto: CreateImportDto(
          (builder) => builder
            ..type = type
            ..fileId = fileId
            ..idempotencyKey = idempotencyKey,
        ),
      );
      return _fromDto(response.data!.data);
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<ImportJobSummary> getById(String id) async {
    try {
      final response = await _api.importsControllerGetById(id: id);
      return _fromDto(response.data!.data);
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<ImportJobSummary> confirm(String id) async {
    try {
      final response = await _api.importsControllerConfirm(id: id);
      return _fromDto(response.data!.data);
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  ImportJobSummary _fromDto(ImportJobDto job) {
    return ImportJobSummary(
      id: job.id,
      type: job.type,
      fileId: job.fileId,
      status: job.status.name,
      rowCount: _jsonToInt(job.rowCount),
      successCount: _jsonToInt(job.successCount),
      errorCount: _jsonToInt(job.errorCount),
    );
  }

  int? _jsonToInt(JsonObject? value) {
    final raw = value?.value;
    if (raw is num) {
      return raw.toInt();
    }
    return null;
  }
}
