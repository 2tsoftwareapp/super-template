//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'job_list_dto.g.dart';

/// JobListDto
///
/// Properties:
/// * [attempts]
/// * [cancelledAt]
/// * [completedAt]
/// * [createdAt]
/// * [createdById]
/// * [errorMessage]
/// * [id]
/// * [maxAttempts]
/// * [organizationId]
/// * [payload]
/// * [priority]
/// * [scheduledAt]
/// * [startedAt]
/// * [status]
/// * [type]
/// * [updatedAt]
@BuiltValue()
abstract class JobListDto implements Built<JobListDto, JobListDtoBuilder> {
  @BuiltValueField(wireName: r'attempts')
  num get attempts;

  @BuiltValueField(wireName: r'cancelledAt')
  JsonObject? get cancelledAt;

  @BuiltValueField(wireName: r'completedAt')
  JsonObject? get completedAt;

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  @BuiltValueField(wireName: r'createdById')
  String? get createdById;

  @BuiltValueField(wireName: r'errorMessage')
  JsonObject? get errorMessage;

  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'maxAttempts')
  num get maxAttempts;

  @BuiltValueField(wireName: r'organizationId')
  JsonObject? get organizationId;

  @BuiltValueField(wireName: r'payload')
  BuiltMap<String, JsonObject?> get payload;

  @BuiltValueField(wireName: r'priority')
  num get priority;

  @BuiltValueField(wireName: r'scheduledAt')
  String get scheduledAt;

  @BuiltValueField(wireName: r'startedAt')
  JsonObject? get startedAt;

  @BuiltValueField(wireName: r'status')
  JobListDtoStatusEnum get status;
  // enum statusEnum {  PENDING,  PROCESSING,  COMPLETED,  CANCELLED,  FAILED,  BLOCKED,  };

  @BuiltValueField(wireName: r'type')
  String get type;

  @BuiltValueField(wireName: r'updatedAt')
  String get updatedAt;

  JobListDto._();

  factory JobListDto([void updates(JobListDtoBuilder b)]) = _$JobListDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(JobListDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<JobListDto> get serializer => _$JobListDtoSerializer();
}

class _$JobListDtoSerializer implements PrimitiveSerializer<JobListDto> {
  @override
  final Iterable<Type> types = const [JobListDto, _$JobListDto];

  @override
  final String wireName = r'JobListDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    JobListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'attempts';
    yield serializers.serialize(
      object.attempts,
      specifiedType: const FullType(num),
    );
    if (object.cancelledAt != null) {
      yield r'cancelledAt';
      yield serializers.serialize(
        object.cancelledAt,
        specifiedType: const FullType(JsonObject),
      );
    }
    if (object.completedAt != null) {
      yield r'completedAt';
      yield serializers.serialize(
        object.completedAt,
        specifiedType: const FullType(JsonObject),
      );
    }
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
    );
    if (object.createdById != null) {
      yield r'createdById';
      yield serializers.serialize(
        object.createdById,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.errorMessage != null) {
      yield r'errorMessage';
      yield serializers.serialize(
        object.errorMessage,
        specifiedType: const FullType(JsonObject),
      );
    }
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'maxAttempts';
    yield serializers.serialize(
      object.maxAttempts,
      specifiedType: const FullType(num),
    );
    if (object.organizationId != null) {
      yield r'organizationId';
      yield serializers.serialize(
        object.organizationId,
        specifiedType: const FullType(JsonObject),
      );
    }
    yield r'payload';
    yield serializers.serialize(
      object.payload,
      specifiedType: const FullType(BuiltMap, [
        FullType(String),
        FullType.nullable(JsonObject),
      ]),
    );
    yield r'priority';
    yield serializers.serialize(
      object.priority,
      specifiedType: const FullType(num),
    );
    yield r'scheduledAt';
    yield serializers.serialize(
      object.scheduledAt,
      specifiedType: const FullType(String),
    );
    if (object.startedAt != null) {
      yield r'startedAt';
      yield serializers.serialize(
        object.startedAt,
        specifiedType: const FullType(JsonObject),
      );
    }
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(JobListDtoStatusEnum),
    );
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(String),
    );
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    JobListDto object, {
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
    required JobListDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'attempts':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(num)) as num;
          result.attempts = valueDes;
          break;
        case r'cancelledAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.cancelledAt = valueDes;
          break;
        case r'completedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.completedAt = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdAt = valueDes;
          break;
        case r'createdById':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.createdById = valueDes;
          break;
        case r'errorMessage':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.errorMessage = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'maxAttempts':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(num)) as num;
          result.maxAttempts = valueDes;
          break;
        case r'organizationId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.organizationId = valueDes;
          break;
        case r'payload':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltMap, [
              FullType(String),
              FullType.nullable(JsonObject),
            ]),
          ) as BuiltMap<String, JsonObject?>;
          result.payload.replace(valueDes);
          break;
        case r'priority':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(num)) as num;
          result.priority = valueDes;
          break;
        case r'scheduledAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.scheduledAt = valueDes;
          break;
        case r'startedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.startedAt = valueDes;
          break;
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobListDtoStatusEnum),
          ) as JobListDtoStatusEnum;
          result.status = valueDes;
          break;
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.type = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.updatedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  JobListDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = JobListDtoBuilder();
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

class JobListDtoStatusEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'PENDING')
  static const JobListDtoStatusEnum PENDING = _$jobListDtoStatusEnum_PENDING;
  @BuiltValueEnumConst(wireName: r'PROCESSING')
  static const JobListDtoStatusEnum PROCESSING =
      _$jobListDtoStatusEnum_PROCESSING;
  @BuiltValueEnumConst(wireName: r'COMPLETED')
  static const JobListDtoStatusEnum COMPLETED =
      _$jobListDtoStatusEnum_COMPLETED;
  @BuiltValueEnumConst(wireName: r'CANCELLED')
  static const JobListDtoStatusEnum CANCELLED =
      _$jobListDtoStatusEnum_CANCELLED;
  @BuiltValueEnumConst(wireName: r'FAILED')
  static const JobListDtoStatusEnum FAILED = _$jobListDtoStatusEnum_FAILED;
  @BuiltValueEnumConst(wireName: r'BLOCKED')
  static const JobListDtoStatusEnum BLOCKED = _$jobListDtoStatusEnum_BLOCKED;

  static Serializer<JobListDtoStatusEnum> get serializer =>
      _$jobListDtoStatusEnumSerializer;

  const JobListDtoStatusEnum._(String name) : super(name);

  static BuiltSet<JobListDtoStatusEnum> get values =>
      _$jobListDtoStatusEnumValues;
  static JobListDtoStatusEnum valueOf(String name) =>
      _$jobListDtoStatusEnumValueOf(name);
}
