//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'job_status_count_dto.g.dart';

/// JobStatusCountDto
///
/// Properties:
/// * [status]
/// * [total]
@BuiltValue()
abstract class JobStatusCountDto
    implements Built<JobStatusCountDto, JobStatusCountDtoBuilder> {
  @BuiltValueField(wireName: r'status')
  String get status;

  @BuiltValueField(wireName: r'total')
  num get total;

  JobStatusCountDto._();

  factory JobStatusCountDto([void updates(JobStatusCountDtoBuilder b)]) =
      _$JobStatusCountDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(JobStatusCountDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<JobStatusCountDto> get serializer =>
      _$JobStatusCountDtoSerializer();
}

class _$JobStatusCountDtoSerializer
    implements PrimitiveSerializer<JobStatusCountDto> {
  @override
  final Iterable<Type> types = const [JobStatusCountDto, _$JobStatusCountDto];

  @override
  final String wireName = r'JobStatusCountDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    JobStatusCountDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(String),
    );
    yield r'total';
    yield serializers.serialize(
      object.total,
      specifiedType: const FullType(num),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    JobStatusCountDto object, {
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
    required JobStatusCountDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.status = valueDes;
          break;
        case r'total':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(num)) as num;
          result.total = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  JobStatusCountDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = JobStatusCountDtoBuilder();
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
