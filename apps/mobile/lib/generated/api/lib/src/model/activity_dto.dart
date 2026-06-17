//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'activity_dto.g.dart';

/// ActivityDto
///
/// Properties:
/// * [id]
/// * [summary]
/// * [entityType]
/// * [entityId]
/// * [actorId]
/// * [visibility]
/// * [metadata]
/// * [createdAt]
@BuiltValue()
abstract class ActivityDto implements Built<ActivityDto, ActivityDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'summary')
  String get summary;

  @BuiltValueField(wireName: r'entityType')
  String get entityType;

  @BuiltValueField(wireName: r'entityId')
  String get entityId;

  @BuiltValueField(wireName: r'actorId')
  String? get actorId;

  @BuiltValueField(wireName: r'visibility')
  ActivityDtoVisibilityEnum get visibility;
  // enum visibilityEnum {  PUBLIC,  PRIVATE,  INTERNAL,  };

  @BuiltValueField(wireName: r'metadata')
  BuiltMap<String, JsonObject?>? get metadata;

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  ActivityDto._();

  factory ActivityDto([void updates(ActivityDtoBuilder b)]) = _$ActivityDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ActivityDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ActivityDto> get serializer => _$ActivityDtoSerializer();
}

class _$ActivityDtoSerializer implements PrimitiveSerializer<ActivityDto> {
  @override
  final Iterable<Type> types = const [ActivityDto, _$ActivityDto];

  @override
  final String wireName = r'ActivityDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ActivityDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'summary';
    yield serializers.serialize(
      object.summary,
      specifiedType: const FullType(String),
    );
    yield r'entityType';
    yield serializers.serialize(
      object.entityType,
      specifiedType: const FullType(String),
    );
    yield r'entityId';
    yield serializers.serialize(
      object.entityId,
      specifiedType: const FullType(String),
    );
    if (object.actorId != null) {
      yield r'actorId';
      yield serializers.serialize(
        object.actorId,
        specifiedType: const FullType.nullable(String),
      );
    }
    yield r'visibility';
    yield serializers.serialize(
      object.visibility,
      specifiedType: const FullType(ActivityDtoVisibilityEnum),
    );
    if (object.metadata != null) {
      yield r'metadata';
      yield serializers.serialize(
        object.metadata,
        specifiedType: const FullType(
            BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
      );
    }
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ActivityDto object, {
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
    required ActivityDtoBuilder result,
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
        case r'summary':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.summary = valueDes;
          break;
        case r'entityType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.entityType = valueDes;
          break;
        case r'entityId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.entityId = valueDes;
          break;
        case r'actorId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.actorId = valueDes;
          break;
        case r'visibility':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ActivityDtoVisibilityEnum),
          ) as ActivityDtoVisibilityEnum;
          result.visibility = valueDes;
          break;
        case r'metadata':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(
                BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
          ) as BuiltMap<String, JsonObject?>;
          result.metadata.replace(valueDes);
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ActivityDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ActivityDtoBuilder();
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

class ActivityDtoVisibilityEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'PUBLIC')
  static const ActivityDtoVisibilityEnum PUBLIC =
      _$activityDtoVisibilityEnum_PUBLIC;
  @BuiltValueEnumConst(wireName: r'PRIVATE')
  static const ActivityDtoVisibilityEnum PRIVATE =
      _$activityDtoVisibilityEnum_PRIVATE;
  @BuiltValueEnumConst(wireName: r'INTERNAL')
  static const ActivityDtoVisibilityEnum INTERNAL =
      _$activityDtoVisibilityEnum_INTERNAL;

  static Serializer<ActivityDtoVisibilityEnum> get serializer =>
      _$activityDtoVisibilityEnumSerializer;

  const ActivityDtoVisibilityEnum._(String name) : super(name);

  static BuiltSet<ActivityDtoVisibilityEnum> get values =>
      _$activityDtoVisibilityEnumValues;
  static ActivityDtoVisibilityEnum valueOf(String name) =>
      _$activityDtoVisibilityEnumValueOf(name);
}
