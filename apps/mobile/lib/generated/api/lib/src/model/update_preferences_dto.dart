//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_preferences_dto.g.dart';

/// UpdatePreferencesDto
///
/// Properties:
/// * [theme]
/// * [language]
/// * [timezone]
/// * [notificationPreferences]
/// * [emailPreferences]
@BuiltValue()
abstract class UpdatePreferencesDto
    implements Built<UpdatePreferencesDto, UpdatePreferencesDtoBuilder> {
  @BuiltValueField(wireName: r'theme')
  String? get theme;

  @BuiltValueField(wireName: r'language')
  String? get language;

  @BuiltValueField(wireName: r'timezone')
  String? get timezone;

  @BuiltValueField(wireName: r'notificationPreferences')
  BuiltMap<String, JsonObject?>? get notificationPreferences;

  @BuiltValueField(wireName: r'emailPreferences')
  BuiltMap<String, JsonObject?>? get emailPreferences;

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
    _$UpdatePreferencesDto
  ];

  @override
  final String wireName = r'UpdatePreferencesDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdatePreferencesDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.theme != null) {
      yield r'theme';
      yield serializers.serialize(
        object.theme,
        specifiedType: const FullType(String),
      );
    }
    if (object.language != null) {
      yield r'language';
      yield serializers.serialize(
        object.language,
        specifiedType: const FullType(String),
      );
    }
    if (object.timezone != null) {
      yield r'timezone';
      yield serializers.serialize(
        object.timezone,
        specifiedType: const FullType(String),
      );
    }
    if (object.notificationPreferences != null) {
      yield r'notificationPreferences';
      yield serializers.serialize(
        object.notificationPreferences,
        specifiedType: const FullType(
            BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
      );
    }
    if (object.emailPreferences != null) {
      yield r'emailPreferences';
      yield serializers.serialize(
        object.emailPreferences,
        specifiedType: const FullType(
            BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdatePreferencesDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object,
            specifiedType: specifiedType)
        .toList();
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
        case r'theme':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.theme = valueDes;
          break;
        case r'language':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.language = valueDes;
          break;
        case r'timezone':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.timezone = valueDes;
          break;
        case r'notificationPreferences':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(
                BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
          ) as BuiltMap<String, JsonObject?>;
          result.notificationPreferences.replace(valueDes);
          break;
        case r'emailPreferences':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(
                BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
          ) as BuiltMap<String, JsonObject?>;
          result.emailPreferences.replace(valueDes);
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
