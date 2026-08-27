//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_preferences_dto.g.dart';

/// UpdatePreferencesDto
///
/// Properties:
/// * [emailPreferences]
/// * [language]
/// * [notificationPreferences]
/// * [theme]
/// * [timezone]
@BuiltValue()
abstract class UpdatePreferencesDto
    implements Built<UpdatePreferencesDto, UpdatePreferencesDtoBuilder> {
  @BuiltValueField(wireName: r'emailPreferences')
  BuiltMap<String, JsonObject?>? get emailPreferences;

  @BuiltValueField(wireName: r'language')
  UpdatePreferencesDtoLanguageEnum? get language;
  // enum languageEnum {  en,  vi,  };

  @BuiltValueField(wireName: r'notificationPreferences')
  BuiltMap<String, JsonObject?>? get notificationPreferences;

  @BuiltValueField(wireName: r'theme')
  UpdatePreferencesDtoThemeEnum? get theme;
  // enum themeEnum {  system,  light,  dark,  };

  @BuiltValueField(wireName: r'timezone')
  String? get timezone;

  UpdatePreferencesDto._();

  factory UpdatePreferencesDto([void updates(UpdatePreferencesDtoBuilder b)]) =
      _$UpdatePreferencesDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdatePreferencesDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdatePreferencesDto> get serializer =>
      _$UpdatePreferencesDtoSerializer();
}

class _$UpdatePreferencesDtoSerializer
    implements PrimitiveSerializer<UpdatePreferencesDto> {
  @override
  final Iterable<Type> types = const [
    UpdatePreferencesDto,
    _$UpdatePreferencesDto,
  ];

  @override
  final String wireName = r'UpdatePreferencesDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdatePreferencesDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.emailPreferences != null) {
      yield r'emailPreferences';
      yield serializers.serialize(
        object.emailPreferences,
        specifiedType: const FullType(BuiltMap, [
          FullType(String),
          FullType.nullable(JsonObject),
        ]),
      );
    }
    if (object.language != null) {
      yield r'language';
      yield serializers.serialize(
        object.language,
        specifiedType: const FullType(UpdatePreferencesDtoLanguageEnum),
      );
    }
    if (object.notificationPreferences != null) {
      yield r'notificationPreferences';
      yield serializers.serialize(
        object.notificationPreferences,
        specifiedType: const FullType(BuiltMap, [
          FullType(String),
          FullType.nullable(JsonObject),
        ]),
      );
    }
    if (object.theme != null) {
      yield r'theme';
      yield serializers.serialize(
        object.theme,
        specifiedType: const FullType(UpdatePreferencesDtoThemeEnum),
      );
    }
    if (object.timezone != null) {
      yield r'timezone';
      yield serializers.serialize(
        object.timezone,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdatePreferencesDto object, {
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
    required UpdatePreferencesDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
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
              UpdatePreferencesDtoLanguageEnum,
            ),
          ) as UpdatePreferencesDtoLanguageEnum;
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
            specifiedType: const FullType(
              UpdatePreferencesDtoThemeEnum,
            ),
          ) as UpdatePreferencesDtoThemeEnum;
          result.theme = valueDes;
          break;
        case r'timezone':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.timezone = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpdatePreferencesDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdatePreferencesDtoBuilder();
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

class UpdatePreferencesDtoLanguageEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'en')
  static const UpdatePreferencesDtoLanguageEnum en =
      _$updatePreferencesDtoLanguageEnum_en;
  @BuiltValueEnumConst(wireName: r'vi')
  static const UpdatePreferencesDtoLanguageEnum vi =
      _$updatePreferencesDtoLanguageEnum_vi;

  static Serializer<UpdatePreferencesDtoLanguageEnum> get serializer =>
      _$updatePreferencesDtoLanguageEnumSerializer;

  const UpdatePreferencesDtoLanguageEnum._(String name) : super(name);

  static BuiltSet<UpdatePreferencesDtoLanguageEnum> get values =>
      _$updatePreferencesDtoLanguageEnumValues;
  static UpdatePreferencesDtoLanguageEnum valueOf(String name) =>
      _$updatePreferencesDtoLanguageEnumValueOf(name);
}

class UpdatePreferencesDtoThemeEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'system')
  static const UpdatePreferencesDtoThemeEnum system =
      _$updatePreferencesDtoThemeEnum_system;
  @BuiltValueEnumConst(wireName: r'light')
  static const UpdatePreferencesDtoThemeEnum light =
      _$updatePreferencesDtoThemeEnum_light;
  @BuiltValueEnumConst(wireName: r'dark')
  static const UpdatePreferencesDtoThemeEnum dark =
      _$updatePreferencesDtoThemeEnum_dark;

  static Serializer<UpdatePreferencesDtoThemeEnum> get serializer =>
      _$updatePreferencesDtoThemeEnumSerializer;

  const UpdatePreferencesDtoThemeEnum._(String name) : super(name);

  static BuiltSet<UpdatePreferencesDtoThemeEnum> get values =>
      _$updatePreferencesDtoThemeEnumValues;
  static UpdatePreferencesDtoThemeEnum valueOf(String name) =>
      _$updatePreferencesDtoThemeEnumValueOf(name);
}
