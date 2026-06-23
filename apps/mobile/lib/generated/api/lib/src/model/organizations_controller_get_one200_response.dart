//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/organization_detail_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'organizations_controller_get_one200_response.g.dart';

/// OrganizationsControllerGetOne200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class OrganizationsControllerGetOne200Response
    implements
        Built<OrganizationsControllerGetOne200Response,
            OrganizationsControllerGetOne200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  OrganizationDetailDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  OrganizationsControllerGetOne200Response._();

  factory OrganizationsControllerGetOne200Response([
    void updates(OrganizationsControllerGetOne200ResponseBuilder b),
  ]) = _$OrganizationsControllerGetOne200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(OrganizationsControllerGetOne200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<OrganizationsControllerGetOne200Response> get serializer =>
      _$OrganizationsControllerGetOne200ResponseSerializer();
}

class _$OrganizationsControllerGetOne200ResponseSerializer
    implements PrimitiveSerializer<OrganizationsControllerGetOne200Response> {
  @override
  final Iterable<Type> types = const [
    OrganizationsControllerGetOne200Response,
    _$OrganizationsControllerGetOne200Response,
  ];

  @override
  final String wireName = r'OrganizationsControllerGetOne200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    OrganizationsControllerGetOne200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(OrganizationDetailDto),
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
    OrganizationsControllerGetOne200Response object, {
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
    required OrganizationsControllerGetOne200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(OrganizationDetailDto),
          ) as OrganizationDetailDto;
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
  OrganizationsControllerGetOne200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = OrganizationsControllerGetOne200ResponseBuilder();
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
