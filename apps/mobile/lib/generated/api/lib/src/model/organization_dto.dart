//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'organization_dto.g.dart';

/// OrganizationDto
///
/// Properties:
/// * [createdAt]
/// * [id]
/// * [name]
/// * [role]
/// * [slug]
/// * [updatedAt]
@BuiltValue()
abstract class OrganizationDto
    implements Built<OrganizationDto, OrganizationDtoBuilder> {
  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'role')
  OrganizationDtoRoleEnum get role;
  // enum roleEnum {  OWNER,  ADMIN,  MEMBER,  };

  @BuiltValueField(wireName: r'slug')
  String get slug;

  @BuiltValueField(wireName: r'updatedAt')
  String get updatedAt;

  OrganizationDto._();

  factory OrganizationDto([void updates(OrganizationDtoBuilder b)]) =
      _$OrganizationDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(OrganizationDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<OrganizationDto> get serializer =>
      _$OrganizationDtoSerializer();
}

class _$OrganizationDtoSerializer
    implements PrimitiveSerializer<OrganizationDto> {
  @override
  final Iterable<Type> types = const [OrganizationDto, _$OrganizationDto];

  @override
  final String wireName = r'OrganizationDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    OrganizationDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
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
      specifiedType: const FullType(OrganizationDtoRoleEnum),
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
    OrganizationDto object, {
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
    required OrganizationDtoBuilder result,
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
            specifiedType: const FullType(OrganizationDtoRoleEnum),
          ) as OrganizationDtoRoleEnum;
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
  OrganizationDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = OrganizationDtoBuilder();
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

class OrganizationDtoRoleEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'OWNER')
  static const OrganizationDtoRoleEnum OWNER = _$organizationDtoRoleEnum_OWNER;
  @BuiltValueEnumConst(wireName: r'ADMIN')
  static const OrganizationDtoRoleEnum ADMIN = _$organizationDtoRoleEnum_ADMIN;
  @BuiltValueEnumConst(wireName: r'MEMBER')
  static const OrganizationDtoRoleEnum MEMBER =
      _$organizationDtoRoleEnum_MEMBER;

  static Serializer<OrganizationDtoRoleEnum> get serializer =>
      _$organizationDtoRoleEnumSerializer;

  const OrganizationDtoRoleEnum._(String name) : super(name);

  static BuiltSet<OrganizationDtoRoleEnum> get values =>
      _$organizationDtoRoleEnumValues;
  static OrganizationDtoRoleEnum valueOf(String name) =>
      _$organizationDtoRoleEnumValueOf(name);
}
