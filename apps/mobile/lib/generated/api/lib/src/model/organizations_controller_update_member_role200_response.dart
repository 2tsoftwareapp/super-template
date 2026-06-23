//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/organization_member_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'organizations_controller_update_member_role200_response.g.dart';

/// OrganizationsControllerUpdateMemberRole200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class OrganizationsControllerUpdateMemberRole200Response
    implements
        Built<OrganizationsControllerUpdateMemberRole200Response,
            OrganizationsControllerUpdateMemberRole200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  OrganizationMemberDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  OrganizationsControllerUpdateMemberRole200Response._();

  factory OrganizationsControllerUpdateMemberRole200Response([
    void updates(OrganizationsControllerUpdateMemberRole200ResponseBuilder b),
  ]) = _$OrganizationsControllerUpdateMemberRole200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(
    OrganizationsControllerUpdateMemberRole200ResponseBuilder b,
  ) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<OrganizationsControllerUpdateMemberRole200Response>
      get serializer =>
          _$OrganizationsControllerUpdateMemberRole200ResponseSerializer();
}

class _$OrganizationsControllerUpdateMemberRole200ResponseSerializer
    implements
        PrimitiveSerializer<
            OrganizationsControllerUpdateMemberRole200Response> {
  @override
  final Iterable<Type> types = const [
    OrganizationsControllerUpdateMemberRole200Response,
    _$OrganizationsControllerUpdateMemberRole200Response,
  ];

  @override
  final String wireName = r'OrganizationsControllerUpdateMemberRole200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    OrganizationsControllerUpdateMemberRole200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(OrganizationMemberDto),
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
    OrganizationsControllerUpdateMemberRole200Response object, {
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
    required OrganizationsControllerUpdateMemberRole200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(OrganizationMemberDto),
          ) as OrganizationMemberDto;
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
  OrganizationsControllerUpdateMemberRole200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = OrganizationsControllerUpdateMemberRole200ResponseBuilder();
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
