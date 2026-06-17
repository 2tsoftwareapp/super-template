import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/errors/app_exception.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:super_template_api/super_template_api.dart';

final preferencesRepositoryProvider = Provider<PreferencesRepository>(
  (ref) => PreferencesRepository(ref.watch(apiClientProvider)),
);

class UserPreferences {
  const UserPreferences({
    required this.theme,
    required this.language,
    required this.timezone,
  });

  final String theme;
  final String language;
  final String timezone;
}

class PreferencesRepository {
  PreferencesRepository(this._client);

  final SuperTemplateApi _client;
  UsersApi get _api => _client.getUsersApi();

  Future<UserPreferences> getPreferences() async {
    try {
      final response = await _api.preferencesControllerGetMyPreferences();
      final data = response.data!.data;
      return UserPreferences(
        theme: data.theme,
        language: data.language,
        timezone: data.timezone,
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> updatePreferences({
    String? theme,
    String? language,
    String? timezone,
  }) async {
    try {
      await _api.preferencesControllerUpdateMyPreferences(
        updatePreferencesDto: UpdatePreferencesDto(
          (b) => b
            ..theme = theme
            ..language = language
            ..timezone = timezone,
        ),
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }
}
