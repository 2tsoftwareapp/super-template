//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/organization_dto.dart';
import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'organization_management_controller_create200_response.g.dart';

/// OrganizationManagementControllerCreate200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class OrganizationManagementControllerCreate200Response
    implements
        Built<OrganizationManagementControllerCreate200Response,
            OrganizationManagementControllerCreate200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  OrganizationDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  OrganizationManagementControllerCreate200Response._();

  factory OrganizationManagementControllerCreate200Response([
    void updates(OrganizationManagementControllerCreate200ResponseBuilder b),
  ]) = _$OrganizationManagementControllerCreate200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(
    OrganizationManagementControllerCreate200ResponseBuilder b,
  ) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<OrganizationManagementControllerCreate200Response>
      get serializer =>
          _$OrganizationManagementControllerCreate200ResponseSerializer();
}

class _$OrganizationManagementControllerCreate200ResponseSerializer
    implements
        PrimitiveSerializer<OrganizationManagementControllerCreate200Response> {
  @override
  final Iterable<Type> types = const [
    OrganizationManagementControllerCreate200Response,
    _$OrganizationManagementControllerCreate200Response,
  ];

  @override
  final String wireName = r'OrganizationManagementControllerCreate200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    OrganizationManagementControllerCreate200Response object, {
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
    OrganizationManagementControllerCreate200Response object, {
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
    required OrganizationManagementControllerCreate200ResponseBuilder result,
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
  OrganizationManagementControllerCreate200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = OrganizationManagementControllerCreate200ResponseBuilder();
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
