//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/organization_dto.dart';
import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'organizations_controller_list200_response.g.dart';

/// OrganizationsControllerList200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class OrganizationsControllerList200Response
    implements
        Built<OrganizationsControllerList200Response,
            OrganizationsControllerList200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  BuiltList<OrganizationDto> get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  OrganizationsControllerList200Response._();

  factory OrganizationsControllerList200Response([
    void updates(OrganizationsControllerList200ResponseBuilder b),
  ]) = _$OrganizationsControllerList200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(OrganizationsControllerList200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<OrganizationsControllerList200Response> get serializer =>
      _$OrganizationsControllerList200ResponseSerializer();
}

class _$OrganizationsControllerList200ResponseSerializer
    implements PrimitiveSerializer<OrganizationsControllerList200Response> {
  @override
  final Iterable<Type> types = const [
    OrganizationsControllerList200Response,
    _$OrganizationsControllerList200Response,
  ];

  @override
  final String wireName = r'OrganizationsControllerList200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    OrganizationsControllerList200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(BuiltList, [FullType(OrganizationDto)]),
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
    OrganizationsControllerList200Response object, {
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
    required OrganizationsControllerList200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [
              FullType(OrganizationDto),
            ]),
          ) as BuiltList<OrganizationDto>;
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
  OrganizationsControllerList200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = OrganizationsControllerList200ResponseBuilder();
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
