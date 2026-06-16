//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_project_dto.g.dart';

/// CreateProjectDto
///
/// Properties:
/// * [name]
/// * [description]
/// * [status]
/// * [ownerId]
@BuiltValue()
abstract class CreateProjectDto
    implements Built<CreateProjectDto, CreateProjectDtoBuilder> {
  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'description')
  String? get description;

  @BuiltValueField(wireName: r'status')
  CreateProjectDtoStatusEnum? get status;
  // enum statusEnum {  DRAFT,  ACTIVE,  ARCHIVED,  };

  @BuiltValueField(wireName: r'ownerId')
  String? get ownerId;

  CreateProjectDto._();

  factory CreateProjectDto([void updates(CreateProjectDtoBuilder b)]) =
      _$CreateProjectDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateProjectDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateProjectDto> get serializer =>
      _$CreateProjectDtoSerializer();
}

class _$CreateProjectDtoSerializer
    implements PrimitiveSerializer<CreateProjectDto> {
  @override
  final Iterable<Type> types = const [CreateProjectDto, _$CreateProjectDto];

  @override
  final String wireName = r'CreateProjectDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateProjectDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
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
        specifiedType: const FullType(CreateProjectDtoStatusEnum),
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
    CreateProjectDto object, {
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
    required CreateProjectDtoBuilder result,
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
            specifiedType: const FullType(CreateProjectDtoStatusEnum),
          ) as CreateProjectDtoStatusEnum;
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
  CreateProjectDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateProjectDtoBuilder();
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

class CreateProjectDtoStatusEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'DRAFT')
  static const CreateProjectDtoStatusEnum DRAFT =
      _$createProjectDtoStatusEnum_DRAFT;
  @BuiltValueEnumConst(wireName: r'ACTIVE')
  static const CreateProjectDtoStatusEnum ACTIVE =
      _$createProjectDtoStatusEnum_ACTIVE;
  @BuiltValueEnumConst(wireName: r'ARCHIVED')
  static const CreateProjectDtoStatusEnum ARCHIVED =
      _$createProjectDtoStatusEnum_ARCHIVED;

  static Serializer<CreateProjectDtoStatusEnum> get serializer =>
      _$createProjectDtoStatusEnumSerializer;

  const CreateProjectDtoStatusEnum._(String name) : super(name);

  static BuiltSet<CreateProjectDtoStatusEnum> get values =>
      _$createProjectDtoStatusEnumValues;
  static CreateProjectDtoStatusEnum valueOf(String name) =>
      _$createProjectDtoStatusEnumValueOf(name);
}
