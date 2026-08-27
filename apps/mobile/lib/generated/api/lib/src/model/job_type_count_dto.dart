//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'job_type_count_dto.g.dart';

/// JobTypeCountDto
///
/// Properties:
/// * [total]
/// * [type]
@BuiltValue()
abstract class JobTypeCountDto
    implements Built<JobTypeCountDto, JobTypeCountDtoBuilder> {
  @BuiltValueField(wireName: r'total')
  num get total;

  @BuiltValueField(wireName: r'type')
  String get type;

  JobTypeCountDto._();

  factory JobTypeCountDto([void updates(JobTypeCountDtoBuilder b)]) =
      _$JobTypeCountDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(JobTypeCountDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<JobTypeCountDto> get serializer =>
      _$JobTypeCountDtoSerializer();
}

class _$JobTypeCountDtoSerializer
    implements PrimitiveSerializer<JobTypeCountDto> {
  @override
  final Iterable<Type> types = const [JobTypeCountDto, _$JobTypeCountDto];

  @override
  final String wireName = r'JobTypeCountDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    JobTypeCountDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'total';
    yield serializers.serialize(
      object.total,
      specifiedType: const FullType(num),
    );
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    JobTypeCountDto object, {
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
    required JobTypeCountDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'total':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(num)) as num;
          result.total = valueDes;
          break;
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
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
  JobTypeCountDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = JobTypeCountDtoBuilder();
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
