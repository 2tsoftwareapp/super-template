import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/errors/app_exception.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:super_template_api/super_template_api.dart';

final filesRepositoryProvider = Provider<FilesRepository>(
  (ref) => FilesRepository(
    ref.watch(apiClientProvider),
    ref.watch(dioProvider),
  ),
);

class FileSummary {
  const FileSummary({
    required this.id,
    required this.originalName,
    required this.mimeType,
    required this.sizeBytes,
  });

  final String id;
  final String originalName;
  final String mimeType;
  final int sizeBytes;
}

class FilesRepository {
  FilesRepository(this._client, this._dio);

  final SuperTemplateApi _client;
  final Dio _dio;

  FilesApi get _api => _client.getFilesApi();

  Future<FileSummary> upload({
    required List<int> bytes,
    required String fileName,
  }) async {
    try {
      final response = await _api.filesControllerUpload(
        file: MultipartFile.fromBytes(bytes, filename: fileName),
      );
      final file = response.data!.data;
      return _toSummary(file);
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<String> getUrl(String id) async {
    try {
      final response = await _api.filesControllerGetUrl(id: id);
      return response.data!.data.url;
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> delete(String id) async {
    try {
      await _api.filesControllerDelete(id: id);
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<List<int>> download(String id) async {
    try {
      final response = await _dio.get<List<int>>(
        '/api/v1/files/$id/download',
        options: Options(responseType: ResponseType.bytes),
      );
      return response.data ?? [];
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  FileSummary _toSummary(FileDto file) {
    return FileSummary(
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes.toInt(),
    );
  }
}
