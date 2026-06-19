//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'replace_role_permissions_dto.g.dart';

/// ReplaceRolePermissionsDto
///
/// Properties:
/// * [permissionIds]
@BuiltValue()
abstract class ReplaceRolePermissionsDto
    implements
        Built<ReplaceRolePermissionsDto, ReplaceRolePermissionsDtoBuilder> {
  @BuiltValueField(wireName: r'permissionIds')
  BuiltList<String> get permissionIds;

  ReplaceRolePermissionsDto._();

  factory ReplaceRolePermissionsDto([
    void updates(ReplaceRolePermissionsDtoBuilder b),
  ]) = _$ReplaceRolePermissionsDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ReplaceRolePermissionsDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ReplaceRolePermissionsDto> get serializer =>
      _$ReplaceRolePermissionsDtoSerializer();
}

class _$ReplaceRolePermissionsDtoSerializer
    implements PrimitiveSerializer<ReplaceRolePermissionsDto> {
  @override
  final Iterable<Type> types = const [
    ReplaceRolePermissionsDto,
    _$ReplaceRolePermissionsDto,
  ];

  @override
  final String wireName = r'ReplaceRolePermissionsDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ReplaceRolePermissionsDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'permissionIds';
    yield serializers.serialize(
      object.permissionIds,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ReplaceRolePermissionsDto object, {
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
    required ReplaceRolePermissionsDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'permissionIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [
              FullType(String),
            ]),
          ) as BuiltList<String>;
          result.permissionIds.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ReplaceRolePermissionsDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ReplaceRolePermissionsDtoBuilder();
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
