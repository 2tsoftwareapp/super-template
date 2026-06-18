//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'replace_user_roles_dto.g.dart';

/// ReplaceUserRolesDto
///
/// Properties:
/// * [role]
/// * [organizationId]
@BuiltValue()
abstract class ReplaceUserRolesDto
    implements Built<ReplaceUserRolesDto, ReplaceUserRolesDtoBuilder> {
  @BuiltValueField(wireName: r'role')
  ReplaceUserRolesDtoRoleEnum get role;
  // enum roleEnum {  ADMIN,  USER,  };

  @BuiltValueField(wireName: r'organizationId')
  String? get organizationId;

  ReplaceUserRolesDto._();

  factory ReplaceUserRolesDto([void updates(ReplaceUserRolesDtoBuilder b)]) =
      _$ReplaceUserRolesDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ReplaceUserRolesDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ReplaceUserRolesDto> get serializer =>
      _$ReplaceUserRolesDtoSerializer();
}

class _$ReplaceUserRolesDtoSerializer
    implements PrimitiveSerializer<ReplaceUserRolesDto> {
  @override
  final Iterable<Type> types = const [
    ReplaceUserRolesDto,
    _$ReplaceUserRolesDto,
  ];

  @override
  final String wireName = r'ReplaceUserRolesDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ReplaceUserRolesDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'role';
    yield serializers.serialize(
      object.role,
      specifiedType: const FullType(ReplaceUserRolesDtoRoleEnum),
    );
    if (object.organizationId != null) {
      yield r'organizationId';
      yield serializers.serialize(
        object.organizationId,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ReplaceUserRolesDto object, {
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
    required ReplaceUserRolesDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'role':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ReplaceUserRolesDtoRoleEnum),
          ) as ReplaceUserRolesDtoRoleEnum;
          result.role = valueDes;
          break;
        case r'organizationId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.organizationId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ReplaceUserRolesDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ReplaceUserRolesDtoBuilder();
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

class ReplaceUserRolesDtoRoleEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'ADMIN')
  static const ReplaceUserRolesDtoRoleEnum ADMIN =
      _$replaceUserRolesDtoRoleEnum_ADMIN;
  @BuiltValueEnumConst(wireName: r'USER')
  static const ReplaceUserRolesDtoRoleEnum USER =
      _$replaceUserRolesDtoRoleEnum_USER;

  static Serializer<ReplaceUserRolesDtoRoleEnum> get serializer =>
      _$replaceUserRolesDtoRoleEnumSerializer;

  const ReplaceUserRolesDtoRoleEnum._(String name) : super(name);

  static BuiltSet<ReplaceUserRolesDtoRoleEnum> get values =>
      _$replaceUserRolesDtoRoleEnumValues;
  static ReplaceUserRolesDtoRoleEnum valueOf(String name) =>
      _$replaceUserRolesDtoRoleEnumValueOf(name);
}
