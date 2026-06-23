import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
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
    this.notificationEmail = false,
    this.notificationPush = false,
    this.emailFrequency = 'instant',
  });

  final String theme;
  final String language;
  final String timezone;
  final bool notificationEmail;
  final bool notificationPush;
  final String emailFrequency;

  static const defaults = UserPreferences(
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
  );

  UserPreferences copyWith({
    String? theme,
    String? language,
    String? timezone,
    bool? notificationEmail,
    bool? notificationPush,
    String? emailFrequency,
  }) =>
      UserPreferences(
        theme: theme ?? this.theme,
        language: language ?? this.language,
        timezone: timezone ?? this.timezone,
        notificationEmail: notificationEmail ?? this.notificationEmail,
        notificationPush: notificationPush ?? this.notificationPush,
        emailFrequency: emailFrequency ?? this.emailFrequency,
      );
}

class PreferencesRepository {
  PreferencesRepository(this._client);

  final SuperTemplateApi _client;
  UsersApi get _api => _client.getUsersApi();

  Future<UserPreferences> getPreferences() async {
    try {
      final response = await _api.preferencesControllerGetMyPreferences();
      final d = response.data!.data;
      final notif = d.notificationPreferences;
      final email = d.emailPreferences;
      return UserPreferences(
        theme: d.theme.name,
        language: d.language.name,
        timezone: d.timezone,
        notificationEmail: _boolValue(notif['email']),
        notificationPush: _boolValue(notif['push']),
        emailFrequency: _stringValue(email['frequency']) ?? 'instant',
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> updatePreferences(UserPreferences prefs) async {
    try {
      await _api.preferencesControllerUpdateMyPreferences(
        updatePreferencesDto: UpdatePreferencesDto(
          (b) => b
            ..theme = UpdatePreferencesDtoThemeEnum.valueOf(prefs.theme)
            ..language = UpdatePreferencesDtoLanguageEnum.valueOf(prefs.language)
            ..timezone = prefs.timezone
            ..notificationPreferences = BuiltMap<String, JsonObject?>({
              'email': JsonObject(prefs.notificationEmail),
              'push': JsonObject(prefs.notificationPush),
            }).toBuilder()
            ..emailPreferences = BuiltMap<String, JsonObject?>({
              'frequency': JsonObject(prefs.emailFrequency),
            }).toBuilder(),
        ),
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  static bool _boolValue(JsonObject? obj) =>
      obj?.value is bool ? (obj!.value as bool) : false;

  static String? _stringValue(JsonObject? obj) =>
      obj?.value is String ? obj!.value as String : null;
}
