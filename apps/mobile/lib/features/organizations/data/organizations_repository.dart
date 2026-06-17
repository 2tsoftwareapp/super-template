import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/errors/app_exception.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:mobile_app/features/organizations/domain/organization_summary.dart';
import 'package:super_template_api/super_template_api.dart';

final organizationsRepositoryProvider = Provider<OrganizationsRepository>(
  (ref) => OrganizationsRepository(ref.watch(apiClientProvider)),
);

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
}
