//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/mfa_status_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'mfa_controller_get_status200_response.g.dart';

/// MfaControllerGetStatus200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class MfaControllerGetStatus200Response
    implements
        Built<MfaControllerGetStatus200Response,
            MfaControllerGetStatus200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  MfaStatusDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  MfaControllerGetStatus200Response._();

  factory MfaControllerGetStatus200Response([
    void updates(MfaControllerGetStatus200ResponseBuilder b),
  ]) = _$MfaControllerGetStatus200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MfaControllerGetStatus200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MfaControllerGetStatus200Response> get serializer =>
      _$MfaControllerGetStatus200ResponseSerializer();
}

class _$MfaControllerGetStatus200ResponseSerializer
    implements PrimitiveSerializer<MfaControllerGetStatus200Response> {
  @override
  final Iterable<Type> types = const [
    MfaControllerGetStatus200Response,
    _$MfaControllerGetStatus200Response,
  ];

  @override
  final String wireName = r'MfaControllerGetStatus200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MfaControllerGetStatus200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(MfaStatusDto),
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
    MfaControllerGetStatus200Response object, {
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
    required MfaControllerGetStatus200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MfaStatusDto),
          ) as MfaStatusDto;
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
  MfaControllerGetStatus200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MfaControllerGetStatus200ResponseBuilder();
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
