//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'organization_member_dto.g.dart';

/// OrganizationMemberDto
///
/// Properties:
/// * [userId]
/// * [email]
/// * [displayName]
/// * [role]
/// * [createdAt]
/// * [updatedAt]
@BuiltValue()
abstract class OrganizationMemberDto
    implements Built<OrganizationMemberDto, OrganizationMemberDtoBuilder> {
  @BuiltValueField(wireName: r'userId')
  String get userId;

  @BuiltValueField(wireName: r'email')
  String get email;

  @BuiltValueField(wireName: r'displayName')
  String get displayName;

  @BuiltValueField(wireName: r'role')
  OrganizationMemberDtoRoleEnum get role;
  // enum roleEnum {  OWNER,  ADMIN,  MEMBER,  };

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  @BuiltValueField(wireName: r'updatedAt')
  String get updatedAt;

  OrganizationMemberDto._();

  factory OrganizationMemberDto([
    void updates(OrganizationMemberDtoBuilder b),
  ]) = _$OrganizationMemberDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(OrganizationMemberDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<OrganizationMemberDto> get serializer =>
      _$OrganizationMemberDtoSerializer();
}

class _$OrganizationMemberDtoSerializer
    implements PrimitiveSerializer<OrganizationMemberDto> {
  @override
  final Iterable<Type> types = const [
    OrganizationMemberDto,
    _$OrganizationMemberDto,
  ];

  @override
  final String wireName = r'OrganizationMemberDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    OrganizationMemberDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'userId';
    yield serializers.serialize(
      object.userId,
      specifiedType: const FullType(String),
    );
    yield r'email';
    yield serializers.serialize(
      object.email,
      specifiedType: const FullType(String),
    );
    yield r'displayName';
    yield serializers.serialize(
      object.displayName,
      specifiedType: const FullType(String),
    );
    yield r'role';
    yield serializers.serialize(
      object.role,
      specifiedType: const FullType(OrganizationMemberDtoRoleEnum),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
    );
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    OrganizationMemberDto object, {
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
    required OrganizationMemberDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'userId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.userId = valueDes;
          break;
        case r'email':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.email = valueDes;
          break;
        case r'displayName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.displayName = valueDes;
          break;
        case r'role':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(
              OrganizationMemberDtoRoleEnum,
            ),
          ) as OrganizationMemberDtoRoleEnum;
          result.role = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdAt = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.updatedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  OrganizationMemberDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = OrganizationMemberDtoBuilder();
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

class OrganizationMemberDtoRoleEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'OWNER')
  static const OrganizationMemberDtoRoleEnum OWNER =
      _$organizationMemberDtoRoleEnum_OWNER;
  @BuiltValueEnumConst(wireName: r'ADMIN')
  static const OrganizationMemberDtoRoleEnum ADMIN =
      _$organizationMemberDtoRoleEnum_ADMIN;
  @BuiltValueEnumConst(wireName: r'MEMBER')
  static const OrganizationMemberDtoRoleEnum MEMBER =
      _$organizationMemberDtoRoleEnum_MEMBER;

  static Serializer<OrganizationMemberDtoRoleEnum> get serializer =>
      _$organizationMemberDtoRoleEnumSerializer;

  const OrganizationMemberDtoRoleEnum._(String name) : super(name);

  static BuiltSet<OrganizationMemberDtoRoleEnum> get values =>
      _$organizationMemberDtoRoleEnumValues;
  static OrganizationMemberDtoRoleEnum valueOf(String name) =>
      _$organizationMemberDtoRoleEnumValueOf(name);
}
