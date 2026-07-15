//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'replace_user_roles_dto.g.dart';

/// ReplaceUserRolesDto
///
/// Properties:
/// * [roleId]
/// * [organizationId]
@BuiltValue()
abstract class ReplaceUserRolesDto
    implements Built<ReplaceUserRolesDto, ReplaceUserRolesDtoBuilder> {
  @BuiltValueField(wireName: r'roleId')
  String get roleId;

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
    yield r'roleId';
    yield serializers.serialize(
      object.roleId,
      specifiedType: const FullType(String),
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
        case r'roleId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.roleId = valueDes;
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
