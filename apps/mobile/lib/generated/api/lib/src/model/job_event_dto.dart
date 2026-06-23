//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'job_event_dto.g.dart';

/// JobEventDto
///
/// Properties:
/// * [id]
/// * [jobId]
/// * [attemptId]
/// * [type]
/// * [message]
/// * [metadata]
/// * [createdAt]
@BuiltValue()
abstract class JobEventDto implements Built<JobEventDto, JobEventDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'jobId')
  String get jobId;

  @BuiltValueField(wireName: r'attemptId')
  String? get attemptId;

  @BuiltValueField(wireName: r'type')
  JobEventDtoTypeEnum get type;
  // enum typeEnum {  claimed,  completed,  failed,  retry_scheduled,  cancelled,  no_handler,  };

  @BuiltValueField(wireName: r'message')
  String? get message;

  @BuiltValueField(wireName: r'metadata')
  BuiltMap<String, JsonObject?>? get metadata;

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  JobEventDto._();

  factory JobEventDto([void updates(JobEventDtoBuilder b)]) = _$JobEventDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(JobEventDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<JobEventDto> get serializer => _$JobEventDtoSerializer();
}

class _$JobEventDtoSerializer implements PrimitiveSerializer<JobEventDto> {
  @override
  final Iterable<Type> types = const [JobEventDto, _$JobEventDto];

  @override
  final String wireName = r'JobEventDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    JobEventDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'jobId';
    yield serializers.serialize(
      object.jobId,
      specifiedType: const FullType(String),
    );
    if (object.attemptId != null) {
      yield r'attemptId';
      yield serializers.serialize(
        object.attemptId,
        specifiedType: const FullType.nullable(String),
      );
    }
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(JobEventDtoTypeEnum),
    );
    if (object.message != null) {
      yield r'message';
      yield serializers.serialize(
        object.message,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.metadata != null) {
      yield r'metadata';
      yield serializers.serialize(
        object.metadata,
        specifiedType: const FullType.nullable(BuiltMap, [
          FullType(String),
          FullType.nullable(JsonObject),
        ]),
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
    JobEventDto object, {
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
    required JobEventDtoBuilder result,
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
        case r'jobId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.jobId = valueDes;
          break;
        case r'attemptId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.attemptId = valueDes;
          break;
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobEventDtoTypeEnum),
          ) as JobEventDtoTypeEnum;
          result.type = valueDes;
          break;
        case r'message':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.message = valueDes;
          break;
        case r'metadata':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(BuiltMap, [
              FullType(String),
              FullType.nullable(JsonObject),
            ]),
          ) as BuiltMap<String, JsonObject?>?;
          if (valueDes == null) continue;
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
  JobEventDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = JobEventDtoBuilder();
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

class JobEventDtoTypeEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'claimed')
  static const JobEventDtoTypeEnum claimed = _$jobEventDtoTypeEnum_claimed;
  @BuiltValueEnumConst(wireName: r'completed')
  static const JobEventDtoTypeEnum completed = _$jobEventDtoTypeEnum_completed;
  @BuiltValueEnumConst(wireName: r'failed')
  static const JobEventDtoTypeEnum failed = _$jobEventDtoTypeEnum_failed;
  @BuiltValueEnumConst(wireName: r'retry_scheduled')
  static const JobEventDtoTypeEnum retryScheduled =
      _$jobEventDtoTypeEnum_retryScheduled;
  @BuiltValueEnumConst(wireName: r'cancelled')
  static const JobEventDtoTypeEnum cancelled = _$jobEventDtoTypeEnum_cancelled;
  @BuiltValueEnumConst(wireName: r'no_handler')
  static const JobEventDtoTypeEnum noHandler = _$jobEventDtoTypeEnum_noHandler;

  static Serializer<JobEventDtoTypeEnum> get serializer =>
      _$jobEventDtoTypeEnumSerializer;

  const JobEventDtoTypeEnum._(String name) : super(name);

  static BuiltSet<JobEventDtoTypeEnum> get values =>
      _$jobEventDtoTypeEnumValues;
  static JobEventDtoTypeEnum valueOf(String name) =>
      _$jobEventDtoTypeEnumValueOf(name);
}
