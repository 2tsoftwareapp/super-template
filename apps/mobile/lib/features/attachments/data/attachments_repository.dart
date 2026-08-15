import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/errors/app_exception.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:mobile_app/features/attachments/domain/attachment_summary.dart';
import 'package:mobile_app/features/files/data/files_repository.dart';
import 'package:super_template_api/super_template_api.dart';

final attachmentsRepositoryProvider = Provider<AttachmentsRepository>(
  (ref) => AttachmentsRepository(
    ref.watch(apiClientProvider),
    ref.watch(filesRepositoryProvider),
  ),
);

class AttachmentsRepository {
  AttachmentsRepository(this._client, this._filesRepository);

  final SuperTemplateApi _client;
  final FilesRepository _filesRepository;

  AttachmentsApi get _api => _client.getAttachmentsApi();

  Future<List<AttachmentSummary>> list({
    required String entityType,
    required String entityId,
  }) async {
    try {
      final response = await _api.attachmentsControllerList(
        entityType: entityType,
        entityId: entityId,
      );
      return response.data!.data
          .map(
            (item) => AttachmentSummary(
              id: item.id,
              fileId: item.fileId,
              label: item.label,
              createdAt: DateTime.parse(item.createdAt),
            ),
          )
          .toList();
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<AttachmentSummary> attach({
    required String fileId,
    required String entityType,
    required String entityId,
    String? label,
  }) async {
    try {
      final response = await _api.attachmentsControllerAttach(
        attachEntityDto: AttachEntityDto(
          (b) => b
            ..fileId = fileId
            ..entityType = entityType
            ..entityId = entityId
            ..label = label,
        ),
      );
      final item = response.data!.data;
      return AttachmentSummary(
        id: item.id,
        fileId: item.fileId,
        label: item.label,
        createdAt: DateTime.parse(item.createdAt),
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> delete(String id) async {
    try {
      await _api.attachmentsControllerDelete(id: id);
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<FileSummary> uploadAndAttach({
    required List<int> bytes,
    required String fileName,
    required String entityType,
    required String entityId,
    String? label,
  }) async {
    final file = await _filesRepository.upload(
      bytes: bytes,
      fileName: fileName,
    );
    await attach(
      fileId: file.id,
      entityType: entityType,
      entityId: entityId,
      label: label ?? fileName,
    );
    return file;
  }

}
