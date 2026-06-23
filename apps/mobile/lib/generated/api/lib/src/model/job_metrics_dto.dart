//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/job_type_count_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:super_template_api/src/model/job_status_count_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'job_metrics_dto.g.dart';

/// JobMetricsDto
///
/// Properties:
/// * [byStatus]
/// * [byType]
/// * [averageDurationMs]
/// * [retryRate]
/// * [failureRate]
/// * [totalCompleted]
/// * [totalFailed]
@BuiltValue()
abstract class JobMetricsDto
    implements Built<JobMetricsDto, JobMetricsDtoBuilder> {
  @BuiltValueField(wireName: r'byStatus')
  BuiltList<JobStatusCountDto> get byStatus;

  @BuiltValueField(wireName: r'byType')
  BuiltList<JobTypeCountDto> get byType;

  @BuiltValueField(wireName: r'averageDurationMs')
  num? get averageDurationMs;

  @BuiltValueField(wireName: r'retryRate')
  num get retryRate;

  @BuiltValueField(wireName: r'failureRate')
  num get failureRate;

  @BuiltValueField(wireName: r'totalCompleted')
  num get totalCompleted;

  @BuiltValueField(wireName: r'totalFailed')
  num get totalFailed;

  JobMetricsDto._();

  factory JobMetricsDto([void updates(JobMetricsDtoBuilder b)]) =
      _$JobMetricsDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(JobMetricsDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<JobMetricsDto> get serializer =>
      _$JobMetricsDtoSerializer();
}

class _$JobMetricsDtoSerializer implements PrimitiveSerializer<JobMetricsDto> {
  @override
  final Iterable<Type> types = const [JobMetricsDto, _$JobMetricsDto];

  @override
  final String wireName = r'JobMetricsDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    JobMetricsDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'byStatus';
    yield serializers.serialize(
      object.byStatus,
      specifiedType: const FullType(BuiltList, [FullType(JobStatusCountDto)]),
    );
    yield r'byType';
    yield serializers.serialize(
      object.byType,
      specifiedType: const FullType(BuiltList, [FullType(JobTypeCountDto)]),
    );
    if (object.averageDurationMs != null) {
      yield r'averageDurationMs';
      yield serializers.serialize(
        object.averageDurationMs,
        specifiedType: const FullType.nullable(num),
      );
    }
    yield r'retryRate';
    yield serializers.serialize(
      object.retryRate,
      specifiedType: const FullType(num),
    );
    yield r'failureRate';
    yield serializers.serialize(
      object.failureRate,
      specifiedType: const FullType(num),
    );
    yield r'totalCompleted';
    yield serializers.serialize(
      object.totalCompleted,
      specifiedType: const FullType(num),
    );
    yield r'totalFailed';
    yield serializers.serialize(
      object.totalFailed,
      specifiedType: const FullType(num),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    JobMetricsDto object, {
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
    required JobMetricsDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'byStatus':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [
              FullType(JobStatusCountDto),
            ]),
          ) as BuiltList<JobStatusCountDto>;
          result.byStatus.replace(valueDes);
          break;
        case r'byType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [
              FullType(JobTypeCountDto),
            ]),
          ) as BuiltList<JobTypeCountDto>;
          result.byType.replace(valueDes);
          break;
        case r'averageDurationMs':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(num),
          ) as num?;
          if (valueDes == null) continue;
          result.averageDurationMs = valueDes;
          break;
        case r'retryRate':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(num)) as num;
          result.retryRate = valueDes;
          break;
        case r'failureRate':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(num)) as num;
          result.failureRate = valueDes;
          break;
        case r'totalCompleted':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(num)) as num;
          result.totalCompleted = valueDes;
          break;
        case r'totalFailed':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(num)) as num;
          result.totalFailed = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  JobMetricsDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = JobMetricsDtoBuilder();
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
