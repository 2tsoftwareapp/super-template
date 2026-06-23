//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:super_template_api/src/model/organization_member_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'organizations_controller_list_members200_response.g.dart';

/// OrganizationsControllerListMembers200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class OrganizationsControllerListMembers200Response
    implements
        Built<OrganizationsControllerListMembers200Response,
            OrganizationsControllerListMembers200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  BuiltList<OrganizationMemberDto> get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  OrganizationsControllerListMembers200Response._();

  factory OrganizationsControllerListMembers200Response([
    void updates(OrganizationsControllerListMembers200ResponseBuilder b),
  ]) = _$OrganizationsControllerListMembers200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(
    OrganizationsControllerListMembers200ResponseBuilder b,
  ) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<OrganizationsControllerListMembers200Response>
      get serializer =>
          _$OrganizationsControllerListMembers200ResponseSerializer();
}

class _$OrganizationsControllerListMembers200ResponseSerializer
    implements
        PrimitiveSerializer<OrganizationsControllerListMembers200Response> {
  @override
  final Iterable<Type> types = const [
    OrganizationsControllerListMembers200Response,
    _$OrganizationsControllerListMembers200Response,
  ];

  @override
  final String wireName = r'OrganizationsControllerListMembers200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    OrganizationsControllerListMembers200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(BuiltList, [
        FullType(OrganizationMemberDto),
      ]),
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
    OrganizationsControllerListMembers200Response object, {
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
    required OrganizationsControllerListMembers200ResponseBuilder result,
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
              FullType(OrganizationMemberDto),
            ]),
          ) as BuiltList<OrganizationMemberDto>;
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
  OrganizationsControllerListMembers200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = OrganizationsControllerListMembers200ResponseBuilder();
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
