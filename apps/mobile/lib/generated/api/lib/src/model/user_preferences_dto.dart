//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'user_preferences_dto.g.dart';

/// UserPreferencesDto
///
/// Properties:
/// * [createdAt]
/// * [emailPreferences]
/// * [language]
/// * [notificationPreferences]
/// * [theme]
/// * [timezone]
/// * [updatedAt]
/// * [userId]
@BuiltValue()
abstract class UserPreferencesDto
    implements Built<UserPreferencesDto, UserPreferencesDtoBuilder> {
  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  @BuiltValueField(wireName: r'emailPreferences')
  BuiltMap<String, JsonObject?> get emailPreferences;

  @BuiltValueField(wireName: r'language')
  UserPreferencesDtoLanguageEnum get language;
  // enum languageEnum {  en,  vi,  };

  @BuiltValueField(wireName: r'notificationPreferences')
  BuiltMap<String, JsonObject?> get notificationPreferences;

  @BuiltValueField(wireName: r'theme')
  UserPreferencesDtoThemeEnum get theme;
  // enum themeEnum {  system,  light,  dark,  };

  @BuiltValueField(wireName: r'timezone')
  String get timezone;

  @BuiltValueField(wireName: r'updatedAt')
  String get updatedAt;

  @BuiltValueField(wireName: r'userId')
  String get userId;

  UserPreferencesDto._();

  factory UserPreferencesDto([void updates(UserPreferencesDtoBuilder b)]) =
      _$UserPreferencesDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UserPreferencesDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UserPreferencesDto> get serializer =>
      _$UserPreferencesDtoSerializer();
}

class _$UserPreferencesDtoSerializer
    implements PrimitiveSerializer<UserPreferencesDto> {
  @override
  final Iterable<Type> types = const [UserPreferencesDto, _$UserPreferencesDto];

  @override
  final String wireName = r'UserPreferencesDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UserPreferencesDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
    );
    yield r'emailPreferences';
    yield serializers.serialize(
      object.emailPreferences,
      specifiedType: const FullType(BuiltMap, [
        FullType(String),
        FullType.nullable(JsonObject),
      ]),
    );
    yield r'language';
    yield serializers.serialize(
      object.language,
      specifiedType: const FullType(UserPreferencesDtoLanguageEnum),
    );
    yield r'notificationPreferences';
    yield serializers.serialize(
      object.notificationPreferences,
      specifiedType: const FullType(BuiltMap, [
        FullType(String),
        FullType.nullable(JsonObject),
      ]),
    );
    yield r'theme';
    yield serializers.serialize(
      object.theme,
      specifiedType: const FullType(UserPreferencesDtoThemeEnum),
    );
    yield r'timezone';
    yield serializers.serialize(
      object.timezone,
      specifiedType: const FullType(String),
    );
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(String),
    );
    yield r'userId';
    yield serializers.serialize(
      object.userId,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    UserPreferencesDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(
      serializers,
      object,
      specifiedType: specifiedType,
    ).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UserPreferencesDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdAt = valueDes;
          break;
        case r'emailPreferences':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltMap, [
              FullType(String),
              FullType.nullable(JsonObject),
            ]),
          ) as BuiltMap<String, JsonObject?>;
          result.emailPreferences.replace(valueDes);
          break;
        case r'language':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(
              UserPreferencesDtoLanguageEnum,
            ),
          ) as UserPreferencesDtoLanguageEnum;
          result.language = valueDes;
          break;
        case r'notificationPreferences':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltMap, [
              FullType(String),
              FullType.nullable(JsonObject),
            ]),
          ) as BuiltMap<String, JsonObject?>;
          result.notificationPreferences.replace(valueDes);
          break;
        case r'theme':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UserPreferencesDtoThemeEnum),
          ) as UserPreferencesDtoThemeEnum;
          result.theme = valueDes;
          break;
        case r'timezone':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.timezone = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.updatedAt = valueDes;
          break;
        case r'userId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.userId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UserPreferencesDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UserPreferencesDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

class UserPreferencesDtoLanguageEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'en')
  static const UserPreferencesDtoLanguageEnum en =
      _$userPreferencesDtoLanguageEnum_en;
  @BuiltValueEnumConst(wireName: r'vi')
  static const UserPreferencesDtoLanguageEnum vi =
      _$userPreferencesDtoLanguageEnum_vi;

  static Serializer<UserPreferencesDtoLanguageEnum> get serializer =>
      _$userPreferencesDtoLanguageEnumSerializer;

  const UserPreferencesDtoLanguageEnum._(String name) : super(name);

  static BuiltSet<UserPreferencesDtoLanguageEnum> get values =>
      _$userPreferencesDtoLanguageEnumValues;
  static UserPreferencesDtoLanguageEnum valueOf(String name) =>
      _$userPreferencesDtoLanguageEnumValueOf(name);
}

class UserPreferencesDtoThemeEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'system')
  static const UserPreferencesDtoThemeEnum system =
      _$userPreferencesDtoThemeEnum_system;
  @BuiltValueEnumConst(wireName: r'light')
  static const UserPreferencesDtoThemeEnum light =
      _$userPreferencesDtoThemeEnum_light;
  @BuiltValueEnumConst(wireName: r'dark')
  static const UserPreferencesDtoThemeEnum dark =
      _$userPreferencesDtoThemeEnum_dark;

  static Serializer<UserPreferencesDtoThemeEnum> get serializer =>
      _$userPreferencesDtoThemeEnumSerializer;

  const UserPreferencesDtoThemeEnum._(String name) : super(name);

  static BuiltSet<UserPreferencesDtoThemeEnum> get values =>
      _$userPreferencesDtoThemeEnumValues;
  static UserPreferencesDtoThemeEnum valueOf(String name) =>
      _$userPreferencesDtoThemeEnumValueOf(name);
}
