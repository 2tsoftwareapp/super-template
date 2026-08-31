//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'user_organization_dto.g.dart';

/// UserOrganizationDto
///
/// Properties:
/// * [createdAt]
/// * [current]
/// * [id]
/// * [name]
/// * [role]
/// * [slug]
/// * [updatedAt]
@BuiltValue()
abstract class UserOrganizationDto
    implements Built<UserOrganizationDto, UserOrganizationDtoBuilder> {
  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  @BuiltValueField(wireName: r'current')
  bool get current;

  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'role')
  UserOrganizationDtoRoleEnum get role;
  // enum roleEnum {  OWNER,  ADMIN,  MEMBER,  };

  @BuiltValueField(wireName: r'slug')
  String get slug;

  @BuiltValueField(wireName: r'updatedAt')
  String get updatedAt;

  UserOrganizationDto._();

  factory UserOrganizationDto([void updates(UserOrganizationDtoBuilder b)]) =
      _$UserOrganizationDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UserOrganizationDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UserOrganizationDto> get serializer =>
      _$UserOrganizationDtoSerializer();
}

class _$UserOrganizationDtoSerializer
    implements PrimitiveSerializer<UserOrganizationDto> {
  @override
  final Iterable<Type> types = const [
    UserOrganizationDto,
    _$UserOrganizationDto,
  ];

  @override
  final String wireName = r'UserOrganizationDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UserOrganizationDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
    );
    yield r'current';
    yield serializers.serialize(
      object.current,
      specifiedType: const FullType(bool),
    );
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
    yield r'role';
    yield serializers.serialize(
      object.role,
      specifiedType: const FullType(UserOrganizationDtoRoleEnum),
    );
    yield r'slug';
    yield serializers.serialize(
      object.slug,
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
    UserOrganizationDto object, {
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
    required UserOrganizationDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdAt = valueDes;
          break;
        case r'current':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.current = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.name = valueDes;
          break;
        case r'role':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UserOrganizationDtoRoleEnum),
          ) as UserOrganizationDtoRoleEnum;
          result.role = valueDes;
          break;
        case r'slug':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.slug = valueDes;
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
  UserOrganizationDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UserOrganizationDtoBuilder();
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

class UserOrganizationDtoRoleEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'OWNER')
  static const UserOrganizationDtoRoleEnum OWNER =
      _$userOrganizationDtoRoleEnum_OWNER;
  @BuiltValueEnumConst(wireName: r'ADMIN')
  static const UserOrganizationDtoRoleEnum ADMIN =
      _$userOrganizationDtoRoleEnum_ADMIN;
  @BuiltValueEnumConst(wireName: r'MEMBER')
  static const UserOrganizationDtoRoleEnum MEMBER =
      _$userOrganizationDtoRoleEnum_MEMBER;

  static Serializer<UserOrganizationDtoRoleEnum> get serializer =>
      _$userOrganizationDtoRoleEnumSerializer;

  const UserOrganizationDtoRoleEnum._(String name) : super(name);

  static BuiltSet<UserOrganizationDtoRoleEnum> get values =>
      _$userOrganizationDtoRoleEnumValues;
  static UserOrganizationDtoRoleEnum valueOf(String name) =>
      _$userOrganizationDtoRoleEnumValueOf(name);
}
