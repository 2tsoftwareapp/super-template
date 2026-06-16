//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/organization_dto.dart';
import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'organizations_controller_create200_response.g.dart';

/// OrganizationsControllerCreate200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class OrganizationsControllerCreate200Response
    implements
        Built<OrganizationsControllerCreate200Response,
            OrganizationsControllerCreate200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  OrganizationDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  OrganizationsControllerCreate200Response._();

  factory OrganizationsControllerCreate200Response(
          [void updates(OrganizationsControllerCreate200ResponseBuilder b)]) =
      _$OrganizationsControllerCreate200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(OrganizationsControllerCreate200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<OrganizationsControllerCreate200Response> get serializer =>
      _$OrganizationsControllerCreate200ResponseSerializer();
}

class _$OrganizationsControllerCreate200ResponseSerializer
    implements PrimitiveSerializer<OrganizationsControllerCreate200Response> {
  @override
  final Iterable<Type> types = const [
    OrganizationsControllerCreate200Response,
    _$OrganizationsControllerCreate200Response
  ];

  @override
  final String wireName = r'OrganizationsControllerCreate200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    OrganizationsControllerCreate200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(OrganizationDto),
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
    OrganizationsControllerCreate200Response object, {
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
    required OrganizationsControllerCreate200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(OrganizationDto),
          ) as OrganizationDto;
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
  OrganizationsControllerCreate200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = OrganizationsControllerCreate200ResponseBuilder();
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
