//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/role_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_roles_controller_create_role201_response.g.dart';

/// AdminRolesControllerCreateRole201Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AdminRolesControllerCreateRole201Response
    implements
        Built<AdminRolesControllerCreateRole201Response,
            AdminRolesControllerCreateRole201ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  RoleDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AdminRolesControllerCreateRole201Response._();

  factory AdminRolesControllerCreateRole201Response([
    void updates(AdminRolesControllerCreateRole201ResponseBuilder b),
  ]) = _$AdminRolesControllerCreateRole201Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminRolesControllerCreateRole201ResponseBuilder b) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminRolesControllerCreateRole201Response> get serializer =>
      _$AdminRolesControllerCreateRole201ResponseSerializer();
}

class _$AdminRolesControllerCreateRole201ResponseSerializer
    implements PrimitiveSerializer<AdminRolesControllerCreateRole201Response> {
  @override
  final Iterable<Type> types = const [
    AdminRolesControllerCreateRole201Response,
    _$AdminRolesControllerCreateRole201Response,
  ];

  @override
  final String wireName = r'AdminRolesControllerCreateRole201Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminRolesControllerCreateRole201Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(RoleDto),
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
    AdminRolesControllerCreateRole201Response object, {
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
    required AdminRolesControllerCreateRole201ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(RoleDto),
          ) as RoleDto;
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
  AdminRolesControllerCreateRole201Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminRolesControllerCreateRole201ResponseBuilder();
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
