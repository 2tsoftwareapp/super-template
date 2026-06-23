// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'update_preferences_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const UpdatePreferencesDtoThemeEnum _$updatePreferencesDtoThemeEnum_system =
    const UpdatePreferencesDtoThemeEnum._('system');
const UpdatePreferencesDtoThemeEnum _$updatePreferencesDtoThemeEnum_light =
    const UpdatePreferencesDtoThemeEnum._('light');
const UpdatePreferencesDtoThemeEnum _$updatePreferencesDtoThemeEnum_dark =
    const UpdatePreferencesDtoThemeEnum._('dark');

UpdatePreferencesDtoThemeEnum _$updatePreferencesDtoThemeEnumValueOf(
  String name,
) {
  switch (name) {
    case 'system':
      return _$updatePreferencesDtoThemeEnum_system;
    case 'light':
      return _$updatePreferencesDtoThemeEnum_light;
    case 'dark':
      return _$updatePreferencesDtoThemeEnum_dark;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<UpdatePreferencesDtoThemeEnum>
    _$updatePreferencesDtoThemeEnumValues =
    BuiltSet<UpdatePreferencesDtoThemeEnum>(
  const <UpdatePreferencesDtoThemeEnum>[
    _$updatePreferencesDtoThemeEnum_system,
    _$updatePreferencesDtoThemeEnum_light,
    _$updatePreferencesDtoThemeEnum_dark,
  ],
);

const UpdatePreferencesDtoLanguageEnum _$updatePreferencesDtoLanguageEnum_en =
    const UpdatePreferencesDtoLanguageEnum._('en');
const UpdatePreferencesDtoLanguageEnum _$updatePreferencesDtoLanguageEnum_vi =
    const UpdatePreferencesDtoLanguageEnum._('vi');

UpdatePreferencesDtoLanguageEnum _$updatePreferencesDtoLanguageEnumValueOf(
  String name,
) {
  switch (name) {
    case 'en':
      return _$updatePreferencesDtoLanguageEnum_en;
    case 'vi':
      return _$updatePreferencesDtoLanguageEnum_vi;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<UpdatePreferencesDtoLanguageEnum>
    _$updatePreferencesDtoLanguageEnumValues =
    BuiltSet<UpdatePreferencesDtoLanguageEnum>(
  const <UpdatePreferencesDtoLanguageEnum>[
    _$updatePreferencesDtoLanguageEnum_en,
    _$updatePreferencesDtoLanguageEnum_vi,
  ],
);

Serializer<UpdatePreferencesDtoThemeEnum>
    _$updatePreferencesDtoThemeEnumSerializer =
    _$UpdatePreferencesDtoThemeEnumSerializer();
Serializer<UpdatePreferencesDtoLanguageEnum>
    _$updatePreferencesDtoLanguageEnumSerializer =
    _$UpdatePreferencesDtoLanguageEnumSerializer();

class _$UpdatePreferencesDtoThemeEnumSerializer
    implements PrimitiveSerializer<UpdatePreferencesDtoThemeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'system': 'system',
    'light': 'light',
    'dark': 'dark',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'system': 'system',
    'light': 'light',
    'dark': 'dark',
  };

  @override
  final Iterable<Type> types = const <Type>[UpdatePreferencesDtoThemeEnum];
  @override
  final String wireName = 'UpdatePreferencesDtoThemeEnum';

  @override
  Object serialize(
    Serializers serializers,
    UpdatePreferencesDtoThemeEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  UpdatePreferencesDtoThemeEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      UpdatePreferencesDtoThemeEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$UpdatePreferencesDtoLanguageEnumSerializer
    implements PrimitiveSerializer<UpdatePreferencesDtoLanguageEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'en': 'en',
    'vi': 'vi',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'en': 'en',
    'vi': 'vi',
  };

  @override
  final Iterable<Type> types = const <Type>[UpdatePreferencesDtoLanguageEnum];
  @override
  final String wireName = 'UpdatePreferencesDtoLanguageEnum';

  @override
  Object serialize(
    Serializers serializers,
    UpdatePreferencesDtoLanguageEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  UpdatePreferencesDtoLanguageEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      UpdatePreferencesDtoLanguageEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$UpdatePreferencesDto extends UpdatePreferencesDto {
  @override
  final UpdatePreferencesDtoThemeEnum? theme;
  @override
  final UpdatePreferencesDtoLanguageEnum? language;
  @override
  final String? timezone;
  @override
  final BuiltMap<String, JsonObject?>? notificationPreferences;
  @override
  final BuiltMap<String, JsonObject?>? emailPreferences;

  factory _$UpdatePreferencesDto([
    void Function(UpdatePreferencesDtoBuilder)? updates,
  ]) =>
      (UpdatePreferencesDtoBuilder()..update(updates))._build();

  _$UpdatePreferencesDto._({
    this.theme,
    this.language,
    this.timezone,
    this.notificationPreferences,
    this.emailPreferences,
  }) : super._();
  @override
  UpdatePreferencesDto rebuild(
    void Function(UpdatePreferencesDtoBuilder) updates,
  ) =>
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

  UpdatePreferencesDtoThemeEnum? _theme;
  UpdatePreferencesDtoThemeEnum? get theme => _$this._theme;
  set theme(UpdatePreferencesDtoThemeEnum? theme) => _$this._theme = theme;

  UpdatePreferencesDtoLanguageEnum? _language;
  UpdatePreferencesDtoLanguageEnum? get language => _$this._language;
  set language(UpdatePreferencesDtoLanguageEnum? language) =>
      _$this._language = language;

  String? _timezone;
  String? get timezone => _$this._timezone;
  set timezone(String? timezone) => _$this._timezone = timezone;

  MapBuilder<String, JsonObject?>? _notificationPreferences;
  MapBuilder<String, JsonObject?> get notificationPreferences =>
      _$this._notificationPreferences ??= MapBuilder<String, JsonObject?>();
  set notificationPreferences(
    MapBuilder<String, JsonObject?>? notificationPreferences,
  ) =>
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
          r'UpdatePreferencesDto',
          _$failedField,
          e.toString(),
        );
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
