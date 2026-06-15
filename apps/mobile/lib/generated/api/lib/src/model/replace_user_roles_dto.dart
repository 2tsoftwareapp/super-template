//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'replace_user_roles_dto.g.dart';

/// ReplaceUserRolesDto
///
/// Properties:
/// * [roleIds]
@BuiltValue()
abstract class ReplaceUserRolesDto
    implements Built<ReplaceUserRolesDto, ReplaceUserRolesDtoBuilder> {
  @BuiltValueField(wireName: r'roleIds')
  BuiltList<String> get roleIds;

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
    yield r'roleIds';
    yield serializers.serialize(
      object.roleIds,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
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
        case r'roleIds':
          final valueDes =
              serializers.deserialize(
                    value,
                    specifiedType: const FullType(BuiltList, [
                      FullType(String),
                    ]),
                  )
                  as BuiltList<String>;
          result.roleIds.replace(valueDes);
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
