//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_project_dto.g.dart';

/// UpdateProjectDto
///
/// Properties:
/// * [name]
/// * [description]
/// * [status]
/// * [ownerId]
@BuiltValue()
abstract class UpdateProjectDto
    implements Built<UpdateProjectDto, UpdateProjectDtoBuilder> {
  @BuiltValueField(wireName: r'name')
  String? get name;

  @BuiltValueField(wireName: r'description')
  String? get description;

  @BuiltValueField(wireName: r'status')
  UpdateProjectDtoStatusEnum? get status;
  // enum statusEnum {  DRAFT,  ACTIVE,  ARCHIVED,  };

  @BuiltValueField(wireName: r'ownerId')
  String? get ownerId;

  UpdateProjectDto._();

  factory UpdateProjectDto([void updates(UpdateProjectDtoBuilder b)]) =
      _$UpdateProjectDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateProjectDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateProjectDto> get serializer =>
      _$UpdateProjectDtoSerializer();
}

class _$UpdateProjectDtoSerializer
    implements PrimitiveSerializer<UpdateProjectDto> {
  @override
  final Iterable<Type> types = const [UpdateProjectDto, _$UpdateProjectDto];

  @override
  final String wireName = r'UpdateProjectDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateProjectDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.name != null) {
      yield r'name';
      yield serializers.serialize(
        object.name,
        specifiedType: const FullType(String),
      );
    }
    if (object.description != null) {
      yield r'description';
      yield serializers.serialize(
        object.description,
        specifiedType: const FullType(String),
      );
    }
    if (object.status != null) {
      yield r'status';
      yield serializers.serialize(
        object.status,
        specifiedType: const FullType(UpdateProjectDtoStatusEnum),
      );
    }
    if (object.ownerId != null) {
      yield r'ownerId';
      yield serializers.serialize(
        object.ownerId,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdateProjectDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object,
            specifiedType: specifiedType)
        .toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpdateProjectDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
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
            specifiedType: const FullType(String),
          ) as String;
          result.description = valueDes;
          break;
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UpdateProjectDtoStatusEnum),
          ) as UpdateProjectDtoStatusEnum;
          result.status = valueDes;
          break;
        case r'ownerId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.ownerId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpdateProjectDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateProjectDtoBuilder();
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

class UpdateProjectDtoStatusEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'DRAFT')
  static const UpdateProjectDtoStatusEnum DRAFT =
      _$updateProjectDtoStatusEnum_DRAFT;
  @BuiltValueEnumConst(wireName: r'ACTIVE')
  static const UpdateProjectDtoStatusEnum ACTIVE =
      _$updateProjectDtoStatusEnum_ACTIVE;
  @BuiltValueEnumConst(wireName: r'ARCHIVED')
  static const UpdateProjectDtoStatusEnum ARCHIVED =
      _$updateProjectDtoStatusEnum_ARCHIVED;

  static Serializer<UpdateProjectDtoStatusEnum> get serializer =>
      _$updateProjectDtoStatusEnumSerializer;

  const UpdateProjectDtoStatusEnum._(String name) : super(name);

  static BuiltSet<UpdateProjectDtoStatusEnum> get values =>
      _$updateProjectDtoStatusEnumValues;
  static UpdateProjectDtoStatusEnum valueOf(String name) =>
      _$updateProjectDtoStatusEnumValueOf(name);
}
