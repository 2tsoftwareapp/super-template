//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_member_role_dto.g.dart';

/// UpdateMemberRoleDto
///
/// Properties:
/// * [role]
@BuiltValue()
abstract class UpdateMemberRoleDto
    implements Built<UpdateMemberRoleDto, UpdateMemberRoleDtoBuilder> {
  @BuiltValueField(wireName: r'role')
  UpdateMemberRoleDtoRoleEnum get role;
  // enum roleEnum {  OWNER,  ADMIN,  MEMBER,  };

  UpdateMemberRoleDto._();

  factory UpdateMemberRoleDto([void updates(UpdateMemberRoleDtoBuilder b)]) =
      _$UpdateMemberRoleDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateMemberRoleDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateMemberRoleDto> get serializer =>
      _$UpdateMemberRoleDtoSerializer();
}

class _$UpdateMemberRoleDtoSerializer
    implements PrimitiveSerializer<UpdateMemberRoleDto> {
  @override
  final Iterable<Type> types = const [
    UpdateMemberRoleDto,
    _$UpdateMemberRoleDto,
  ];

  @override
  final String wireName = r'UpdateMemberRoleDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateMemberRoleDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'role';
    yield serializers.serialize(
      object.role,
      specifiedType: const FullType(UpdateMemberRoleDtoRoleEnum),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdateMemberRoleDto object, {
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
    required UpdateMemberRoleDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'role':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UpdateMemberRoleDtoRoleEnum),
          ) as UpdateMemberRoleDtoRoleEnum;
          result.role = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpdateMemberRoleDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateMemberRoleDtoBuilder();
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

class UpdateMemberRoleDtoRoleEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'OWNER')
  static const UpdateMemberRoleDtoRoleEnum OWNER =
      _$updateMemberRoleDtoRoleEnum_OWNER;
  @BuiltValueEnumConst(wireName: r'ADMIN')
  static const UpdateMemberRoleDtoRoleEnum ADMIN =
      _$updateMemberRoleDtoRoleEnum_ADMIN;
  @BuiltValueEnumConst(wireName: r'MEMBER')
  static const UpdateMemberRoleDtoRoleEnum MEMBER =
      _$updateMemberRoleDtoRoleEnum_MEMBER;

  static Serializer<UpdateMemberRoleDtoRoleEnum> get serializer =>
      _$updateMemberRoleDtoRoleEnumSerializer;

  const UpdateMemberRoleDtoRoleEnum._(String name) : super(name);

  static BuiltSet<UpdateMemberRoleDtoRoleEnum> get values =>
      _$updateMemberRoleDtoRoleEnumValues;
  static UpdateMemberRoleDtoRoleEnum valueOf(String name) =>
      _$updateMemberRoleDtoRoleEnumValueOf(name);
}
