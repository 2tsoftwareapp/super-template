import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/errors/app_exception.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:mobile_app/features/comments/domain/comment_summary.dart';
import 'package:super_template_api/super_template_api.dart';

final commentsRepositoryProvider = Provider<CommentsRepository>(
  (ref) => CommentsRepository(ref.watch(apiClientProvider)),
);

class CommentsRepository {
  CommentsRepository(this._client);

  final SuperTemplateApi _client;
  CommentsApi get _api => _client.getCommentsApi();

  Future<List<CommentSummary>> list({
    required String entityType,
    required String entityId,
  }) async {
    try {
      final response = await _api.commentsControllerList(
        entityType: entityType,
        entityId: entityId,
      );
      return response.data!.data
          .map(
            (comment) => CommentSummary(
              id: comment.id,
              authorId: comment.authorId,
              content: comment.content,
              createdAt: DateTime.parse(comment.createdAt),
            ),
          )
          .toList();
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<CommentSummary> create({
    required String entityType,
    required String entityId,
    required String content,
  }) async {
    try {
      final response = await _api.commentsControllerCreate(
        createCommentDto: CreateCommentDto(
          (b) => b
            ..entityType = entityType
            ..entityId = entityId
            ..content = content,
        ),
      );
      final comment = response.data!.data;
      return CommentSummary(
        id: comment.id,
        authorId: comment.authorId,
        content: comment.content,
        createdAt: DateTime.parse(comment.createdAt),
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> delete(String id) async {
    try {
      await _api.commentsControllerDelete(id: id);
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }
}
