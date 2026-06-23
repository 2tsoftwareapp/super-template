//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'job_dependency_dto.g.dart';

/// JobDependencyDto
///
/// Properties:
/// * [id]
/// * [dependsOnJobId]
/// * [dependsOnJobStatus]
/// * [createdAt]
@BuiltValue()
abstract class JobDependencyDto
    implements Built<JobDependencyDto, JobDependencyDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'dependsOnJobId')
  String get dependsOnJobId;

  @BuiltValueField(wireName: r'dependsOnJobStatus')
  JobDependencyDtoDependsOnJobStatusEnum get dependsOnJobStatus;
  // enum dependsOnJobStatusEnum {  PENDING,  PROCESSING,  COMPLETED,  CANCELLED,  FAILED,  };

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  JobDependencyDto._();

  factory JobDependencyDto([void updates(JobDependencyDtoBuilder b)]) =
      _$JobDependencyDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(JobDependencyDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<JobDependencyDto> get serializer =>
      _$JobDependencyDtoSerializer();
}

class _$JobDependencyDtoSerializer
    implements PrimitiveSerializer<JobDependencyDto> {
  @override
  final Iterable<Type> types = const [JobDependencyDto, _$JobDependencyDto];

  @override
  final String wireName = r'JobDependencyDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    JobDependencyDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'dependsOnJobId';
    yield serializers.serialize(
      object.dependsOnJobId,
      specifiedType: const FullType(String),
    );
    yield r'dependsOnJobStatus';
    yield serializers.serialize(
      object.dependsOnJobStatus,
      specifiedType: const FullType(JobDependencyDtoDependsOnJobStatusEnum),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    JobDependencyDto object, {
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
    required JobDependencyDtoBuilder result,
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
        case r'dependsOnJobId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.dependsOnJobId = valueDes;
          break;
        case r'dependsOnJobStatus':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(
              JobDependencyDtoDependsOnJobStatusEnum,
            ),
          ) as JobDependencyDtoDependsOnJobStatusEnum;
          result.dependsOnJobStatus = valueDes;
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
  JobDependencyDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = JobDependencyDtoBuilder();
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

class JobDependencyDtoDependsOnJobStatusEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'PENDING')
  static const JobDependencyDtoDependsOnJobStatusEnum PENDING =
      _$jobDependencyDtoDependsOnJobStatusEnum_PENDING;
  @BuiltValueEnumConst(wireName: r'PROCESSING')
  static const JobDependencyDtoDependsOnJobStatusEnum PROCESSING =
      _$jobDependencyDtoDependsOnJobStatusEnum_PROCESSING;
  @BuiltValueEnumConst(wireName: r'COMPLETED')
  static const JobDependencyDtoDependsOnJobStatusEnum COMPLETED =
      _$jobDependencyDtoDependsOnJobStatusEnum_COMPLETED;
  @BuiltValueEnumConst(wireName: r'CANCELLED')
  static const JobDependencyDtoDependsOnJobStatusEnum CANCELLED =
      _$jobDependencyDtoDependsOnJobStatusEnum_CANCELLED;
  @BuiltValueEnumConst(wireName: r'FAILED')
  static const JobDependencyDtoDependsOnJobStatusEnum FAILED =
      _$jobDependencyDtoDependsOnJobStatusEnum_FAILED;

  static Serializer<JobDependencyDtoDependsOnJobStatusEnum> get serializer =>
      _$jobDependencyDtoDependsOnJobStatusEnumSerializer;

  const JobDependencyDtoDependsOnJobStatusEnum._(String name) : super(name);

  static BuiltSet<JobDependencyDtoDependsOnJobStatusEnum> get values =>
      _$jobDependencyDtoDependsOnJobStatusEnumValues;
  static JobDependencyDtoDependsOnJobStatusEnum valueOf(String name) =>
      _$jobDependencyDtoDependsOnJobStatusEnumValueOf(name);
}
