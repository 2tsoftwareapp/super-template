//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:super_template_api/src/model/permission_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_roles_controller_list_permissions200_response.g.dart';

/// AdminRolesControllerListPermissions200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AdminRolesControllerListPermissions200Response
    implements
        Built<AdminRolesControllerListPermissions200Response,
            AdminRolesControllerListPermissions200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  BuiltList<PermissionDto> get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AdminRolesControllerListPermissions200Response._();

  factory AdminRolesControllerListPermissions200Response([
    void updates(AdminRolesControllerListPermissions200ResponseBuilder b),
  ]) = _$AdminRolesControllerListPermissions200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(
    AdminRolesControllerListPermissions200ResponseBuilder b,
  ) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminRolesControllerListPermissions200Response>
      get serializer =>
          _$AdminRolesControllerListPermissions200ResponseSerializer();
}

class _$AdminRolesControllerListPermissions200ResponseSerializer
    implements
        PrimitiveSerializer<AdminRolesControllerListPermissions200Response> {
  @override
  final Iterable<Type> types = const [
    AdminRolesControllerListPermissions200Response,
    _$AdminRolesControllerListPermissions200Response,
  ];

  @override
  final String wireName = r'AdminRolesControllerListPermissions200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminRolesControllerListPermissions200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(BuiltList, [FullType(PermissionDto)]),
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
    AdminRolesControllerListPermissions200Response object, {
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
    required AdminRolesControllerListPermissions200ResponseBuilder result,
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
              FullType(PermissionDto),
            ]),
          ) as BuiltList<PermissionDto>;
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
  AdminRolesControllerListPermissions200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminRolesControllerListPermissions200ResponseBuilder();
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
