//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'role_assignment_dto.g.dart';

/// RoleAssignmentDto
///
/// Properties:
/// * [organizationId]
/// * [roleId]
/// * [roleName]
@BuiltValue()
abstract class RoleAssignmentDto
    implements Built<RoleAssignmentDto, RoleAssignmentDtoBuilder> {
  @BuiltValueField(wireName: r'organizationId')
  String? get organizationId;

  @BuiltValueField(wireName: r'roleId')
  String get roleId;

  @BuiltValueField(wireName: r'roleName')
  String get roleName;

  RoleAssignmentDto._();

  factory RoleAssignmentDto([void updates(RoleAssignmentDtoBuilder b)]) =
      _$RoleAssignmentDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RoleAssignmentDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RoleAssignmentDto> get serializer =>
      _$RoleAssignmentDtoSerializer();
}

class _$RoleAssignmentDtoSerializer
    implements PrimitiveSerializer<RoleAssignmentDto> {
  @override
  final Iterable<Type> types = const [RoleAssignmentDto, _$RoleAssignmentDto];

  @override
  final String wireName = r'RoleAssignmentDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RoleAssignmentDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'organizationId';
    yield object.organizationId == null
        ? null
        : serializers.serialize(
            object.organizationId,
            specifiedType: const FullType.nullable(String),
          );
    yield r'roleId';
    yield serializers.serialize(
      object.roleId,
      specifiedType: const FullType(String),
    );
    yield r'roleName';
    yield serializers.serialize(
      object.roleName,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    RoleAssignmentDto object, {
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
    required RoleAssignmentDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'organizationId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.organizationId = valueDes;
          break;
        case r'roleId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.roleId = valueDes;
          break;
        case r'roleName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.roleName = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  RoleAssignmentDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RoleAssignmentDtoBuilder();
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
