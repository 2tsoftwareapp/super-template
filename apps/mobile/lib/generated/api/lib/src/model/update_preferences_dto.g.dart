// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'update_preferences_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdatePreferencesDto extends UpdatePreferencesDto {
  @override
  final String? theme;
  @override
  final String? language;
  @override
  final String? timezone;
  @override
  final BuiltMap<String, JsonObject?>? notificationPreferences;
  @override
  final BuiltMap<String, JsonObject?>? emailPreferences;

  factory _$UpdatePreferencesDto(
          [void Function(UpdatePreferencesDtoBuilder)? updates]) =>
      (UpdatePreferencesDtoBuilder()..update(updates))._build();

  _$UpdatePreferencesDto._(
      {this.theme,
      this.language,
      this.timezone,
      this.notificationPreferences,
      this.emailPreferences})
      : super._();
  @override
  UpdatePreferencesDto rebuild(
          void Function(UpdatePreferencesDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdatePreferencesDtoBuilder toBuilder() =>
      UpdatePreferencesDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdatePreferencesDto &&
        theme == other.theme &&
        language == other.language &&
        timezone == other.timezone &&
        notificationPreferences == other.notificationPreferences &&
        emailPreferences == other.emailPreferences;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, theme.hashCode);
    _$hash = $jc(_$hash, language.hashCode);
    _$hash = $jc(_$hash, timezone.hashCode);
    _$hash = $jc(_$hash, notificationPreferences.hashCode);
    _$hash = $jc(_$hash, emailPreferences.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdatePreferencesDto')
          ..add('theme', theme)
          ..add('language', language)
          ..add('timezone', timezone)
          ..add('notificationPreferences', notificationPreferences)
          ..add('emailPreferences', emailPreferences))
        .toString();
  }
}

class UpdatePreferencesDtoBuilder
    implements Builder<UpdatePreferencesDto, UpdatePreferencesDtoBuilder> {
  _$UpdatePreferencesDto? _$v;

  String? _theme;
  String? get theme => _$this._theme;
  set theme(String? theme) => _$this._theme = theme;

  String? _language;
  String? get language => _$this._language;
  set language(String? language) => _$this._language = language;

  String? _timezone;
  String? get timezone => _$this._timezone;
  set timezone(String? timezone) => _$this._timezone = timezone;

  MapBuilder<String, JsonObject?>? _notificationPreferences;
  MapBuilder<String, JsonObject?> get notificationPreferences =>
      _$this._notificationPreferences ??= MapBuilder<String, JsonObject?>();
  set notificationPreferences(
          MapBuilder<String, JsonObject?>? notificationPreferences) =>
      _$this._notificationPreferences = notificationPreferences;

  MapBuilder<String, JsonObject?>? _emailPreferences;
  MapBuilder<String, JsonObject?> get emailPreferences =>
      _$this._emailPreferences ??= MapBuilder<String, JsonObject?>();
  set emailPreferences(MapBuilder<String, JsonObject?>? emailPreferences) =>
      _$this._emailPreferences = emailPreferences;

  UpdatePreferencesDtoBuilder() {
    UpdatePreferencesDto._defaults(this);
  }

  UpdatePreferencesDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _theme = $v.theme;
      _language = $v.language;
      _timezone = $v.timezone;
      _notificationPreferences = $v.notificationPreferences?.toBuilder();
      _emailPreferences = $v.emailPreferences?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdatePreferencesDto other) {
    _$v = other as _$UpdatePreferencesDto;
  }

  @override
  void update(void Function(UpdatePreferencesDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdatePreferencesDto build() => _build();

  _$UpdatePreferencesDto _build() {
    _$UpdatePreferencesDto _$result;
    try {
      _$result = _$v ??
          _$UpdatePreferencesDto._(
            theme: theme,
            language: language,
            timezone: timezone,
            notificationPreferences: _notificationPreferences?.build(),
            emailPreferences: _emailPreferences?.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'notificationPreferences';
        _notificationPreferences?.build();
        _$failedField = 'emailPreferences';
        _emailPreferences?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'UpdatePreferencesDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
