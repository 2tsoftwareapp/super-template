import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/errors/app_exception.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:mobile_app/features/organizations/domain/organization_summary.dart';
import 'package:super_template_api/super_template_api.dart';

final organizationsListProvider = FutureProvider(
  (ref) => ref.watch(organizationsRepositoryProvider).list(),
);

final organizationsRepositoryProvider = Provider<OrganizationsRepository>(
  (ref) => OrganizationsRepository(ref.watch(apiClientProvider)),
);

class OrganizationDetail {
  const OrganizationDetail({
    required this.id,
    required this.name,
    required this.slug,
    required this.role,
    required this.memberCount,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String name;
  final String slug;
  final String role;
  final num memberCount;
  final String createdAt;
  final String updatedAt;
}

class OrganizationMember {
  const OrganizationMember({
    required this.userId,
    required this.email,
    required this.displayName,
    required this.role,
  });

  final String userId;
  final String email;
  final String displayName;
  final String role;
}

class OrganizationsRepository {
  OrganizationsRepository(this._client);

  final SuperTemplateApi _client;
  OrganizationsApi get _api => _client.getOrganizationsApi();

  Future<List<OrganizationSummary>> list() async {
    try {
      final response = await _api.organizationsControllerList();
      return response.data!.data
          .map(
            (org) => OrganizationSummary(
              id: org.id,
              name: org.name,
              slug: org.slug,
              role: org.role.name,
              isCurrent: org.current,
            ),
          )
          .toList();
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<OrganizationSummary> create({required String name}) async {
    try {
      final response = await _api.organizationsControllerCreate(
        createOrganizationDto: CreateOrganizationDto((b) => b..name = name),
      );
      final org = response.data!.data;
      return OrganizationSummary(
        id: org.id,
        name: org.name,
        slug: org.slug,
        role: org.role.name,
        isCurrent: org.current,
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<OrganizationDetail> getDetail(String id) async {
    try {
      final response = await _api.organizationsControllerGetOne(id: id);
      final d = response.data!.data;
      return OrganizationDetail(
        id: d.id,
        name: d.name,
        slug: d.slug,
        role: d.role.name,
        memberCount: d.memberCount,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<OrganizationDetail> update({
    required String id,
    required String name,
  }) async {
    try {
      final response = await _api.organizationsControllerUpdate(
        id: id,
        updateOrganizationDto: UpdateOrganizationDto((b) => b..name = name),
      );
      final d = response.data!.data;
      return OrganizationDetail(
        id: d.id,
        name: d.name,
        slug: d.slug,
        role: d.role.name,
        memberCount: d.memberCount,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> delete(String id) async {
    try {
      await _api.organizationsControllerRemove(id: id);
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> leave(String id) async {
    try {
      await _api.organizationsControllerLeave(id: id);
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<List<OrganizationMember>> listMembers(String organizationId) async {
    try {
      final response = await _api.organizationsControllerListMembers(
        id: organizationId,
      );
      return response.data!.data
          .map(
            (m) => OrganizationMember(
              userId: m.userId,
              email: m.email,
              displayName: m.displayName,
              role: m.role.name,
            ),
          )
          .toList();
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> updateMemberRole({
    required String organizationId,
    required String userId,
    required String role,
  }) async {
    try {
      await _api.organizationsControllerUpdateMemberRole(
        id: organizationId,
        userId: userId,
        updateMemberRoleDto: UpdateMemberRoleDto(
          (b) => b..role = UpdateMemberRoleDtoRoleEnum.valueOf(role),
        ),
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> removeMember({
    required String organizationId,
    required String userId,
  }) async {
    try {
      await _api.organizationsControllerRemoveMember(
        id: organizationId,
        userId: userId,
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }
}
