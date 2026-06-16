//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/health_status_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'health_controller_get_health200_response.g.dart';

/// HealthControllerGetHealth200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class HealthControllerGetHealth200Response
    implements
        Built<HealthControllerGetHealth200Response,
            HealthControllerGetHealth200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  HealthStatusDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  HealthControllerGetHealth200Response._();

  factory HealthControllerGetHealth200Response(
          [void updates(HealthControllerGetHealth200ResponseBuilder b)]) =
      _$HealthControllerGetHealth200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(HealthControllerGetHealth200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<HealthControllerGetHealth200Response> get serializer =>
      _$HealthControllerGetHealth200ResponseSerializer();
}

class _$HealthControllerGetHealth200ResponseSerializer
    implements PrimitiveSerializer<HealthControllerGetHealth200Response> {
  @override
  final Iterable<Type> types = const [
    HealthControllerGetHealth200Response,
    _$HealthControllerGetHealth200Response
  ];

  @override
  final String wireName = r'HealthControllerGetHealth200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    HealthControllerGetHealth200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(HealthStatusDto),
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
    HealthControllerGetHealth200Response object, {
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
    required HealthControllerGetHealth200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(HealthStatusDto),
          ) as HealthStatusDto;
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
  HealthControllerGetHealth200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = HealthControllerGetHealth200ResponseBuilder();
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
