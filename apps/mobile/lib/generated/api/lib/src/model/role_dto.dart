//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:super_template_api/src/model/permission_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'role_dto.g.dart';

/// RoleDto
///
/// Properties:
/// * [description]
/// * [id]
/// * [isSystem]
/// * [name]
/// * [organizationId]
/// * [permissions]
/// * [scope]
@BuiltValue()
abstract class RoleDto implements Built<RoleDto, RoleDtoBuilder> {
  @BuiltValueField(wireName: r'description')
  String? get description;

  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'isSystem')
  bool get isSystem;

  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'organizationId')
  String? get organizationId;

  @BuiltValueField(wireName: r'permissions')
  BuiltList<PermissionDto> get permissions;

  @BuiltValueField(wireName: r'scope')
  RoleDtoScopeEnum get scope;
  // enum scopeEnum {  platform,  organization,  };

  RoleDto._();

  factory RoleDto([void updates(RoleDtoBuilder b)]) = _$RoleDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RoleDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RoleDto> get serializer => _$RoleDtoSerializer();
}

class _$RoleDtoSerializer implements PrimitiveSerializer<RoleDto> {
  @override
  final Iterable<Type> types = const [RoleDto, _$RoleDto];

  @override
  final String wireName = r'RoleDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RoleDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'description';
    yield object.description == null
        ? null
        : serializers.serialize(
            object.description,
            specifiedType: const FullType.nullable(String),
          );
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'isSystem';
    yield serializers.serialize(
      object.isSystem,
      specifiedType: const FullType(bool),
    );
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
    yield r'organizationId';
    yield object.organizationId == null
        ? null
        : serializers.serialize(
            object.organizationId,
            specifiedType: const FullType.nullable(String),
          );
    yield r'permissions';
    yield serializers.serialize(
      object.permissions,
      specifiedType: const FullType(BuiltList, [FullType(PermissionDto)]),
    );
    yield r'scope';
    yield serializers.serialize(
      object.scope,
      specifiedType: const FullType(RoleDtoScopeEnum),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    RoleDto object, {
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
    required RoleDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'description':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.description = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'isSystem':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isSystem = valueDes;
          break;
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.name = valueDes;
          break;
        case r'organizationId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.organizationId = valueDes;
          break;
        case r'permissions':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [
              FullType(PermissionDto),
            ]),
          ) as BuiltList<PermissionDto>;
          result.permissions.replace(valueDes);
          break;
        case r'scope':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(RoleDtoScopeEnum),
          ) as RoleDtoScopeEnum;
          result.scope = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  RoleDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RoleDtoBuilder();
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

class RoleDtoScopeEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'platform')
  static const RoleDtoScopeEnum platform = _$roleDtoScopeEnum_platform;
  @BuiltValueEnumConst(wireName: r'organization')
  static const RoleDtoScopeEnum organization = _$roleDtoScopeEnum_organization;

  static Serializer<RoleDtoScopeEnum> get serializer =>
      _$roleDtoScopeEnumSerializer;

  const RoleDtoScopeEnum._(String name) : super(name);

  static BuiltSet<RoleDtoScopeEnum> get values => _$roleDtoScopeEnumValues;
  static RoleDtoScopeEnum valueOf(String name) =>
      _$roleDtoScopeEnumValueOf(name);
}
