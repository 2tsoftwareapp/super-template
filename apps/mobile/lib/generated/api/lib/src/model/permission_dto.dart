//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'permission_dto.g.dart';

/// PermissionDto
///
/// Properties:
/// * [id]
/// * [name]
/// * [description]
/// * [isSystem]
/// * [scope]
@BuiltValue()
abstract class PermissionDto
    implements Built<PermissionDto, PermissionDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'description')
  String? get description;

  @BuiltValueField(wireName: r'isSystem')
  bool get isSystem;

  @BuiltValueField(wireName: r'scope')
  PermissionDtoScopeEnum get scope;
  // enum scopeEnum {  platform,  organization,  };

  PermissionDto._();

  factory PermissionDto([void updates(PermissionDtoBuilder b)]) =
      _$PermissionDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(PermissionDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<PermissionDto> get serializer =>
      _$PermissionDtoSerializer();
}

class _$PermissionDtoSerializer implements PrimitiveSerializer<PermissionDto> {
  @override
  final Iterable<Type> types = const [PermissionDto, _$PermissionDto];

  @override
  final String wireName = r'PermissionDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    PermissionDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
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
    yield r'description';
    yield object.description == null
        ? null
        : serializers.serialize(
            object.description,
            specifiedType: const FullType.nullable(String),
          );
    yield r'isSystem';
    yield serializers.serialize(
      object.isSystem,
      specifiedType: const FullType(bool),
    );
    yield r'scope';
    yield serializers.serialize(
      object.scope,
      specifiedType: const FullType(PermissionDtoScopeEnum),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    PermissionDto object, {
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
    required PermissionDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
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
        case r'description':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.description = valueDes;
          break;
        case r'isSystem':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isSystem = valueDes;
          break;
        case r'scope':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(PermissionDtoScopeEnum),
          ) as PermissionDtoScopeEnum;
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
  PermissionDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = PermissionDtoBuilder();
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

class PermissionDtoScopeEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'platform')
  static const PermissionDtoScopeEnum platform =
      _$permissionDtoScopeEnum_platform;
  @BuiltValueEnumConst(wireName: r'organization')
  static const PermissionDtoScopeEnum organization =
      _$permissionDtoScopeEnum_organization;

  static Serializer<PermissionDtoScopeEnum> get serializer =>
      _$permissionDtoScopeEnumSerializer;

  const PermissionDtoScopeEnum._(String name) : super(name);

  static BuiltSet<PermissionDtoScopeEnum> get values =>
      _$permissionDtoScopeEnumValues;
  static PermissionDtoScopeEnum valueOf(String name) =>
      _$permissionDtoScopeEnumValueOf(name);
}
