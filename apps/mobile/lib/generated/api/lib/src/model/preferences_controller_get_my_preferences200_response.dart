//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/user_preferences_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'preferences_controller_get_my_preferences200_response.g.dart';

/// PreferencesControllerGetMyPreferences200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class PreferencesControllerGetMyPreferences200Response
    implements
        Built<PreferencesControllerGetMyPreferences200Response,
            PreferencesControllerGetMyPreferences200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  UserPreferencesDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  PreferencesControllerGetMyPreferences200Response._();

  factory PreferencesControllerGetMyPreferences200Response([
    void updates(PreferencesControllerGetMyPreferences200ResponseBuilder b),
  ]) = _$PreferencesControllerGetMyPreferences200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(
    PreferencesControllerGetMyPreferences200ResponseBuilder b,
  ) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<PreferencesControllerGetMyPreferences200Response>
      get serializer =>
          _$PreferencesControllerGetMyPreferences200ResponseSerializer();
}

class _$PreferencesControllerGetMyPreferences200ResponseSerializer
    implements
        PrimitiveSerializer<PreferencesControllerGetMyPreferences200Response> {
  @override
  final Iterable<Type> types = const [
    PreferencesControllerGetMyPreferences200Response,
    _$PreferencesControllerGetMyPreferences200Response,
  ];

  @override
  final String wireName = r'PreferencesControllerGetMyPreferences200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    PreferencesControllerGetMyPreferences200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(UserPreferencesDto),
    );
    yield r'meta';
    yield serializers.serialize(
      object.meta,
      specifiedType: const FullType(RequestMetaDto),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    PreferencesControllerGetMyPreferences200Response object, {
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
    required PreferencesControllerGetMyPreferences200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UserPreferencesDto),
          ) as UserPreferencesDto;
          result.data.replace(valueDes);
          break;
        case r'meta':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(RequestMetaDto),
          ) as RequestMetaDto;
          result.meta.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  PreferencesControllerGetMyPreferences200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = PreferencesControllerGetMyPreferences200ResponseBuilder();
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
