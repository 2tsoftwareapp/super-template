import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/errors/app_exception.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:mobile_app/features/invitations/domain/invitation_summary.dart';
import 'package:super_template_api/super_template_api.dart';

final invitationsRepositoryProvider = Provider<InvitationsRepository>(
  (ref) => InvitationsRepository(ref.watch(apiClientProvider)),
);

class InvitationsRepository {
  InvitationsRepository(this._client);

  final SuperTemplateApi _client;
  InvitationsApi get _api => _client.getInvitationsApi();

  Future<List<InvitationSummary>> list({
    String? entityType,
    String? entityId,
  }) async {
    try {
      final response = await _api.invitationsControllerList(
        entityType: entityType,
        entityId: entityId,
      );
      return response.data!.data
          .map(
            (invitation) => InvitationSummary(
              id: invitation.id,
              email: invitation.email,
              status: invitation.status.name,
              expiresAt: DateTime.parse(invitation.expiresAt),
            ),
          )
          .toList();
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> create({
    required String email,
    required String entityType,
    required String entityId,
    String? role,
  }) async {
    try {
      await _api.invitationsControllerCreate(
        createInvitationDto: CreateInvitationDto(
          (b) => b
            ..email = email
            ..entityType = entityType
            ..entityId = entityId
            ..role = role,
        ),
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> accept(String token) async {
    try {
      await _api.invitationsControllerAccept(
        acceptInvitationDto: AcceptInvitationDto((b) => b..token = token),
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> revoke(String id) async {
    try {
      await _api.invitationsControllerRevoke(id: id);
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }
}
