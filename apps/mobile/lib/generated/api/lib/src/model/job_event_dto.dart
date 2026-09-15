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
/// * [attemptId]
/// * [createdAt]
/// * [id]
/// * [jobId]
/// * [message]
/// * [metadata]
/// * [type] - `failed` means the job reached FAILED; `processing_error` means an error escaped the processing cycle before a terminal status was recorded, so the job stays PROCESSING; `dependency_failed` means the job was moved to BLOCKED because this event's dependency (named in `message`) reached a blocking status.
@BuiltValue()
abstract class JobEventDto implements Built<JobEventDto, JobEventDtoBuilder> {
  @BuiltValueField(wireName: r'attemptId')
  String? get attemptId;

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'jobId')
  String get jobId;

  @BuiltValueField(wireName: r'message')
  String? get message;

  @BuiltValueField(wireName: r'metadata')
  BuiltMap<String, JsonObject?>? get metadata;

  /// `failed` means the job reached FAILED; `processing_error` means an error escaped the processing cycle before a terminal status was recorded, so the job stays PROCESSING; `dependency_failed` means the job was moved to BLOCKED because this event's dependency (named in `message`) reached a blocking status.
  @BuiltValueField(wireName: r'type')
  JobEventDtoTypeEnum get type;
  // enum typeEnum {  claimed,  completed,  failed,  processing_error,  retry_scheduled,  cancelled,  no_handler,  dependency_failed,  };

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
    if (object.attemptId != null) {
      yield r'attemptId';
      yield serializers.serialize(
        object.attemptId,
        specifiedType: const FullType.nullable(String),
      );
    }
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
    );
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
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(JobEventDtoTypeEnum),
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
        case r'attemptId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.attemptId = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdAt = valueDes;
          break;
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
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobEventDtoTypeEnum),
          ) as JobEventDtoTypeEnum;
          result.type = valueDes;
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
  /// `failed` means the job reached FAILED; `processing_error` means an error escaped the processing cycle before a terminal status was recorded, so the job stays PROCESSING; `dependency_failed` means the job was moved to BLOCKED because this event's dependency (named in `message`) reached a blocking status.
  @BuiltValueEnumConst(wireName: r'claimed')
  static const JobEventDtoTypeEnum claimed = _$jobEventDtoTypeEnum_claimed;

  /// `failed` means the job reached FAILED; `processing_error` means an error escaped the processing cycle before a terminal status was recorded, so the job stays PROCESSING; `dependency_failed` means the job was moved to BLOCKED because this event's dependency (named in `message`) reached a blocking status.
  @BuiltValueEnumConst(wireName: r'completed')
  static const JobEventDtoTypeEnum completed = _$jobEventDtoTypeEnum_completed;

  /// `failed` means the job reached FAILED; `processing_error` means an error escaped the processing cycle before a terminal status was recorded, so the job stays PROCESSING; `dependency_failed` means the job was moved to BLOCKED because this event's dependency (named in `message`) reached a blocking status.
  @BuiltValueEnumConst(wireName: r'failed')
  static const JobEventDtoTypeEnum failed = _$jobEventDtoTypeEnum_failed;

  /// `failed` means the job reached FAILED; `processing_error` means an error escaped the processing cycle before a terminal status was recorded, so the job stays PROCESSING; `dependency_failed` means the job was moved to BLOCKED because this event's dependency (named in `message`) reached a blocking status.
  @BuiltValueEnumConst(wireName: r'processing_error')
  static const JobEventDtoTypeEnum processingError =
      _$jobEventDtoTypeEnum_processingError;

  /// `failed` means the job reached FAILED; `processing_error` means an error escaped the processing cycle before a terminal status was recorded, so the job stays PROCESSING; `dependency_failed` means the job was moved to BLOCKED because this event's dependency (named in `message`) reached a blocking status.
  @BuiltValueEnumConst(wireName: r'retry_scheduled')
  static const JobEventDtoTypeEnum retryScheduled =
      _$jobEventDtoTypeEnum_retryScheduled;

  /// `failed` means the job reached FAILED; `processing_error` means an error escaped the processing cycle before a terminal status was recorded, so the job stays PROCESSING; `dependency_failed` means the job was moved to BLOCKED because this event's dependency (named in `message`) reached a blocking status.
  @BuiltValueEnumConst(wireName: r'cancelled')
  static const JobEventDtoTypeEnum cancelled = _$jobEventDtoTypeEnum_cancelled;

  /// `failed` means the job reached FAILED; `processing_error` means an error escaped the processing cycle before a terminal status was recorded, so the job stays PROCESSING; `dependency_failed` means the job was moved to BLOCKED because this event's dependency (named in `message`) reached a blocking status.
  @BuiltValueEnumConst(wireName: r'no_handler')
  static const JobEventDtoTypeEnum noHandler = _$jobEventDtoTypeEnum_noHandler;

  /// `failed` means the job reached FAILED; `processing_error` means an error escaped the processing cycle before a terminal status was recorded, so the job stays PROCESSING; `dependency_failed` means the job was moved to BLOCKED because this event's dependency (named in `message`) reached a blocking status.
  @BuiltValueEnumConst(wireName: r'dependency_failed')
  static const JobEventDtoTypeEnum dependencyFailed =
      _$jobEventDtoTypeEnum_dependencyFailed;

  static Serializer<JobEventDtoTypeEnum> get serializer =>
      _$jobEventDtoTypeEnumSerializer;

  const JobEventDtoTypeEnum._(String name) : super(name);

  static BuiltSet<JobEventDtoTypeEnum> get values =>
      _$jobEventDtoTypeEnumValues;
  static JobEventDtoTypeEnum valueOf(String name) =>
      _$jobEventDtoTypeEnumValueOf(name);
}
