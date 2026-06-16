//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'project_dto.g.dart';

/// ProjectDto
///
/// Properties:
/// * [id]
/// * [name]
/// * [description]
/// * [status]
/// * [ownerId]
/// * [createdById]
/// * [updatedById]
/// * [createdAt]
/// * [updatedAt]
/// * [deletedAt]
@BuiltValue()
abstract class ProjectDto implements Built<ProjectDto, ProjectDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'description')
  JsonObject? get description;

  @BuiltValueField(wireName: r'status')
  ProjectDtoStatusEnum get status;
  // enum statusEnum {  DRAFT,  ACTIVE,  ARCHIVED,  };

  @BuiltValueField(wireName: r'ownerId')
  String get ownerId;

  @BuiltValueField(wireName: r'createdById')
  String get createdById;

  @BuiltValueField(wireName: r'updatedById')
  JsonObject? get updatedById;

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  @BuiltValueField(wireName: r'updatedAt')
  String get updatedAt;

  @BuiltValueField(wireName: r'deletedAt')
  JsonObject? get deletedAt;

  ProjectDto._();

  factory ProjectDto([void updates(ProjectDtoBuilder b)]) = _$ProjectDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ProjectDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ProjectDto> get serializer => _$ProjectDtoSerializer();
}

class _$ProjectDtoSerializer implements PrimitiveSerializer<ProjectDto> {
  @override
  final Iterable<Type> types = const [ProjectDto, _$ProjectDto];

  @override
  final String wireName = r'ProjectDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ProjectDto object, {
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
    if (object.description != null) {
      yield r'description';
      yield serializers.serialize(
        object.description,
        specifiedType: const FullType(JsonObject),
      );
    }
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(ProjectDtoStatusEnum),
    );
    yield r'ownerId';
    yield serializers.serialize(
      object.ownerId,
      specifiedType: const FullType(String),
    );
    yield r'createdById';
    yield serializers.serialize(
      object.createdById,
      specifiedType: const FullType(String),
    );
    if (object.updatedById != null) {
      yield r'updatedById';
      yield serializers.serialize(
        object.updatedById,
        specifiedType: const FullType(JsonObject),
      );
    }
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
    );
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(String),
    );
    if (object.deletedAt != null) {
      yield r'deletedAt';
      yield serializers.serialize(
        object.deletedAt,
        specifiedType: const FullType(JsonObject),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ProjectDto object, {
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
    required ProjectDtoBuilder result,
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
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.description = valueDes;
          break;
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ProjectDtoStatusEnum),
          ) as ProjectDtoStatusEnum;
          result.status = valueDes;
          break;
        case r'ownerId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.ownerId = valueDes;
          break;
        case r'createdById':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdById = valueDes;
          break;
        case r'updatedById':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.updatedById = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdAt = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.updatedAt = valueDes;
          break;
        case r'deletedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.deletedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ProjectDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ProjectDtoBuilder();
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

class ProjectDtoStatusEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'DRAFT')
  static const ProjectDtoStatusEnum DRAFT = _$projectDtoStatusEnum_DRAFT;
  @BuiltValueEnumConst(wireName: r'ACTIVE')
  static const ProjectDtoStatusEnum ACTIVE = _$projectDtoStatusEnum_ACTIVE;
  @BuiltValueEnumConst(wireName: r'ARCHIVED')
  static const ProjectDtoStatusEnum ARCHIVED = _$projectDtoStatusEnum_ARCHIVED;

  static Serializer<ProjectDtoStatusEnum> get serializer =>
      _$projectDtoStatusEnumSerializer;

  const ProjectDtoStatusEnum._(String name) : super(name);

  static BuiltSet<ProjectDtoStatusEnum> get values =>
      _$projectDtoStatusEnumValues;
  static ProjectDtoStatusEnum valueOf(String name) =>
      _$projectDtoStatusEnumValueOf(name);
}
