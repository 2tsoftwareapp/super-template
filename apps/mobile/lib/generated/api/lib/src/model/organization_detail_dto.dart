//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'organization_detail_dto.g.dart';

/// OrganizationDetailDto
///
/// Properties:
/// * [createdAt]
/// * [id]
/// * [memberCount]
/// * [name]
/// * [role]
/// * [slug]
/// * [updatedAt]
@BuiltValue()
abstract class OrganizationDetailDto
    implements Built<OrganizationDetailDto, OrganizationDetailDtoBuilder> {
  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'memberCount')
  num get memberCount;

  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'role')
  OrganizationDetailDtoRoleEnum get role;
  // enum roleEnum {  OWNER,  ADMIN,  MEMBER,  };

  @BuiltValueField(wireName: r'slug')
  String get slug;

  @BuiltValueField(wireName: r'updatedAt')
  String get updatedAt;

  OrganizationDetailDto._();

  factory OrganizationDetailDto([
    void updates(OrganizationDetailDtoBuilder b),
  ]) = _$OrganizationDetailDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(OrganizationDetailDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<OrganizationDetailDto> get serializer =>
      _$OrganizationDetailDtoSerializer();
}

class _$OrganizationDetailDtoSerializer
    implements PrimitiveSerializer<OrganizationDetailDto> {
  @override
  final Iterable<Type> types = const [
    OrganizationDetailDto,
    _$OrganizationDetailDto,
  ];

  @override
  final String wireName = r'OrganizationDetailDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    OrganizationDetailDto object, {
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
    yield r'memberCount';
    yield serializers.serialize(
      object.memberCount,
      specifiedType: const FullType(num),
    );
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
    yield r'role';
    yield serializers.serialize(
      object.role,
      specifiedType: const FullType(OrganizationDetailDtoRoleEnum),
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
    OrganizationDetailDto object, {
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
    required OrganizationDetailDtoBuilder result,
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
        case r'memberCount':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(num)) as num;
          result.memberCount = valueDes;
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
            specifiedType: const FullType(
              OrganizationDetailDtoRoleEnum,
            ),
          ) as OrganizationDetailDtoRoleEnum;
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
  OrganizationDetailDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = OrganizationDetailDtoBuilder();
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

class OrganizationDetailDtoRoleEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'OWNER')
  static const OrganizationDetailDtoRoleEnum OWNER =
      _$organizationDetailDtoRoleEnum_OWNER;
  @BuiltValueEnumConst(wireName: r'ADMIN')
  static const OrganizationDetailDtoRoleEnum ADMIN =
      _$organizationDetailDtoRoleEnum_ADMIN;
  @BuiltValueEnumConst(wireName: r'MEMBER')
  static const OrganizationDetailDtoRoleEnum MEMBER =
      _$organizationDetailDtoRoleEnum_MEMBER;

  static Serializer<OrganizationDetailDtoRoleEnum> get serializer =>
      _$organizationDetailDtoRoleEnumSerializer;

  const OrganizationDetailDtoRoleEnum._(String name) : super(name);

  static BuiltSet<OrganizationDetailDtoRoleEnum> get values =>
      _$organizationDetailDtoRoleEnumValues;
  static OrganizationDetailDtoRoleEnum valueOf(String name) =>
      _$organizationDetailDtoRoleEnumValueOf(name);
}
