//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/start_sso_login_response_dto.dart';
import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'sso_controller_start_login200_response.g.dart';

/// SsoControllerStartLogin200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class SsoControllerStartLogin200Response
    implements
        Built<SsoControllerStartLogin200Response,
            SsoControllerStartLogin200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  StartSsoLoginResponseDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  SsoControllerStartLogin200Response._();

  factory SsoControllerStartLogin200Response([
    void updates(SsoControllerStartLogin200ResponseBuilder b),
  ]) = _$SsoControllerStartLogin200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SsoControllerStartLogin200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SsoControllerStartLogin200Response> get serializer =>
      _$SsoControllerStartLogin200ResponseSerializer();
}

class _$SsoControllerStartLogin200ResponseSerializer
    implements PrimitiveSerializer<SsoControllerStartLogin200Response> {
  @override
  final Iterable<Type> types = const [
    SsoControllerStartLogin200Response,
    _$SsoControllerStartLogin200Response,
  ];

  @override
  final String wireName = r'SsoControllerStartLogin200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SsoControllerStartLogin200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(StartSsoLoginResponseDto),
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
    SsoControllerStartLogin200Response object, {
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
    required SsoControllerStartLogin200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(StartSsoLoginResponseDto),
          ) as StartSsoLoginResponseDto;
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
  SsoControllerStartLogin200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SsoControllerStartLogin200ResponseBuilder();
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
