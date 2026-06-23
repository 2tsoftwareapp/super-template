// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'user_preferences_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const UserPreferencesDtoThemeEnum _$userPreferencesDtoThemeEnum_system =
    const UserPreferencesDtoThemeEnum._('system');
const UserPreferencesDtoThemeEnum _$userPreferencesDtoThemeEnum_light =
    const UserPreferencesDtoThemeEnum._('light');
const UserPreferencesDtoThemeEnum _$userPreferencesDtoThemeEnum_dark =
    const UserPreferencesDtoThemeEnum._('dark');

UserPreferencesDtoThemeEnum _$userPreferencesDtoThemeEnumValueOf(String name) {
  switch (name) {
    case 'system':
      return _$userPreferencesDtoThemeEnum_system;
    case 'light':
      return _$userPreferencesDtoThemeEnum_light;
    case 'dark':
      return _$userPreferencesDtoThemeEnum_dark;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<UserPreferencesDtoThemeEnum>
    _$userPreferencesDtoThemeEnumValues =
    BuiltSet<UserPreferencesDtoThemeEnum>(const <UserPreferencesDtoThemeEnum>[
  _$userPreferencesDtoThemeEnum_system,
  _$userPreferencesDtoThemeEnum_light,
  _$userPreferencesDtoThemeEnum_dark,
]);

const UserPreferencesDtoLanguageEnum _$userPreferencesDtoLanguageEnum_en =
    const UserPreferencesDtoLanguageEnum._('en');
const UserPreferencesDtoLanguageEnum _$userPreferencesDtoLanguageEnum_vi =
    const UserPreferencesDtoLanguageEnum._('vi');

UserPreferencesDtoLanguageEnum _$userPreferencesDtoLanguageEnumValueOf(
  String name,
) {
  switch (name) {
    case 'en':
      return _$userPreferencesDtoLanguageEnum_en;
    case 'vi':
      return _$userPreferencesDtoLanguageEnum_vi;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<UserPreferencesDtoLanguageEnum>
    _$userPreferencesDtoLanguageEnumValues =
    BuiltSet<UserPreferencesDtoLanguageEnum>(
  const <UserPreferencesDtoLanguageEnum>[
    _$userPreferencesDtoLanguageEnum_en,
    _$userPreferencesDtoLanguageEnum_vi,
  ],
);

Serializer<UserPreferencesDtoThemeEnum>
    _$userPreferencesDtoThemeEnumSerializer =
    _$UserPreferencesDtoThemeEnumSerializer();
Serializer<UserPreferencesDtoLanguageEnum>
    _$userPreferencesDtoLanguageEnumSerializer =
    _$UserPreferencesDtoLanguageEnumSerializer();

class _$UserPreferencesDtoThemeEnumSerializer
    implements PrimitiveSerializer<UserPreferencesDtoThemeEnum> {
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
  final Iterable<Type> types = const <Type>[UserPreferencesDtoThemeEnum];
  @override
  final String wireName = 'UserPreferencesDtoThemeEnum';

  @override
  Object serialize(
    Serializers serializers,
    UserPreferencesDtoThemeEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  UserPreferencesDtoThemeEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      UserPreferencesDtoThemeEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$UserPreferencesDtoLanguageEnumSerializer
    implements PrimitiveSerializer<UserPreferencesDtoLanguageEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'en': 'en',
    'vi': 'vi',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'en': 'en',
    'vi': 'vi',
  };

  @override
  final Iterable<Type> types = const <Type>[UserPreferencesDtoLanguageEnum];
  @override
  final String wireName = 'UserPreferencesDtoLanguageEnum';

  @override
  Object serialize(
    Serializers serializers,
    UserPreferencesDtoLanguageEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  UserPreferencesDtoLanguageEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      UserPreferencesDtoLanguageEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$UserPreferencesDto extends UserPreferencesDto {
  @override
  final String userId;
  @override
  final UserPreferencesDtoThemeEnum theme;
  @override
  final UserPreferencesDtoLanguageEnum language;
  @override
  final String timezone;
  @override
  final BuiltMap<String, JsonObject?> notificationPreferences;
  @override
  final BuiltMap<String, JsonObject?> emailPreferences;
  @override
  final String createdAt;
  @override
  final String updatedAt;

  factory _$UserPreferencesDto([
    void Function(UserPreferencesDtoBuilder)? updates,
  ]) =>
      (UserPreferencesDtoBuilder()..update(updates))._build();

  _$UserPreferencesDto._({
    required this.userId,
    required this.theme,
    required this.language,
    required this.timezone,
    required this.notificationPreferences,
    required this.emailPreferences,
    required this.createdAt,
    required this.updatedAt,
  }) : super._();
  @override
  UserPreferencesDto rebuild(
    void Function(UserPreferencesDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  UserPreferencesDtoBuilder toBuilder() =>
      UserPreferencesDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UserPreferencesDto &&
        userId == other.userId &&
        theme == other.theme &&
        language == other.language &&
        timezone == other.timezone &&
        notificationPreferences == other.notificationPreferences &&
        emailPreferences == other.emailPreferences &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, userId.hashCode);
    _$hash = $jc(_$hash, theme.hashCode);
    _$hash = $jc(_$hash, language.hashCode);
    _$hash = $jc(_$hash, timezone.hashCode);
    _$hash = $jc(_$hash, notificationPreferences.hashCode);
    _$hash = $jc(_$hash, emailPreferences.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UserPreferencesDto')
          ..add('userId', userId)
          ..add('theme', theme)
          ..add('language', language)
          ..add('timezone', timezone)
          ..add('notificationPreferences', notificationPreferences)
          ..add('emailPreferences', emailPreferences)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class UserPreferencesDtoBuilder
    implements Builder<UserPreferencesDto, UserPreferencesDtoBuilder> {
  _$UserPreferencesDto? _$v;

  String? _userId;
  String? get userId => _$this._userId;
  set userId(String? userId) => _$this._userId = userId;

  UserPreferencesDtoThemeEnum? _theme;
  UserPreferencesDtoThemeEnum? get theme => _$this._theme;
  set theme(UserPreferencesDtoThemeEnum? theme) => _$this._theme = theme;

  UserPreferencesDtoLanguageEnum? _language;
  UserPreferencesDtoLanguageEnum? get language => _$this._language;
  set language(UserPreferencesDtoLanguageEnum? language) =>
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

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  UserPreferencesDtoBuilder() {
    UserPreferencesDto._defaults(this);
  }

  UserPreferencesDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _userId = $v.userId;
      _theme = $v.theme;
      _language = $v.language;
      _timezone = $v.timezone;
      _notificationPreferences = $v.notificationPreferences.toBuilder();
      _emailPreferences = $v.emailPreferences.toBuilder();
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UserPreferencesDto other) {
    _$v = other as _$UserPreferencesDto;
  }

  @override
  void update(void Function(UserPreferencesDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UserPreferencesDto build() => _build();

  _$UserPreferencesDto _build() {
    _$UserPreferencesDto _$result;
    try {
      _$result = _$v ??
          _$UserPreferencesDto._(
            userId: BuiltValueNullFieldError.checkNotNull(
              userId,
              r'UserPreferencesDto',
              'userId',
            ),
            theme: BuiltValueNullFieldError.checkNotNull(
              theme,
              r'UserPreferencesDto',
              'theme',
            ),
            language: BuiltValueNullFieldError.checkNotNull(
              language,
              r'UserPreferencesDto',
              'language',
            ),
            timezone: BuiltValueNullFieldError.checkNotNull(
              timezone,
              r'UserPreferencesDto',
              'timezone',
            ),
            notificationPreferences: notificationPreferences.build(),
            emailPreferences: emailPreferences.build(),
            createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt,
              r'UserPreferencesDto',
              'createdAt',
            ),
            updatedAt: BuiltValueNullFieldError.checkNotNull(
              updatedAt,
              r'UserPreferencesDto',
              'updatedAt',
            ),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'notificationPreferences';
        notificationPreferences.build();
        _$failedField = 'emailPreferences';
        emailPreferences.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'UserPreferencesDto',
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
