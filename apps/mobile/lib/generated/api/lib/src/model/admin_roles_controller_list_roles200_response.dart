//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:super_template_api/src/model/role_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_roles_controller_list_roles200_response.g.dart';

/// AdminRolesControllerListRoles200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AdminRolesControllerListRoles200Response
    implements
        Built<AdminRolesControllerListRoles200Response,
            AdminRolesControllerListRoles200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  BuiltList<RoleDto> get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AdminRolesControllerListRoles200Response._();

  factory AdminRolesControllerListRoles200Response(
          [void updates(AdminRolesControllerListRoles200ResponseBuilder b)]) =
      _$AdminRolesControllerListRoles200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminRolesControllerListRoles200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminRolesControllerListRoles200Response> get serializer =>
      _$AdminRolesControllerListRoles200ResponseSerializer();
}

class _$AdminRolesControllerListRoles200ResponseSerializer
    implements PrimitiveSerializer<AdminRolesControllerListRoles200Response> {
  @override
  final Iterable<Type> types = const [
    AdminRolesControllerListRoles200Response,
    _$AdminRolesControllerListRoles200Response
  ];

  @override
  final String wireName = r'AdminRolesControllerListRoles200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminRolesControllerListRoles200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(BuiltList, [FullType(RoleDto)]),
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
    AdminRolesControllerListRoles200Response object, {
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
    required AdminRolesControllerListRoles200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(RoleDto)]),
          ) as BuiltList<RoleDto>;
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
  AdminRolesControllerListRoles200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminRolesControllerListRoles200ResponseBuilder();
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
