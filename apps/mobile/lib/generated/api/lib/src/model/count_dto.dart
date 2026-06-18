//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'count_dto.g.dart';

/// CountDto
///
/// Properties:
/// * [count]
@BuiltValue()
abstract class CountDto implements Built<CountDto, CountDtoBuilder> {
  @BuiltValueField(wireName: r'count')
  num get count;

  CountDto._();

  factory CountDto([void updates(CountDtoBuilder b)]) = _$CountDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CountDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CountDto> get serializer => _$CountDtoSerializer();
}

class _$CountDtoSerializer implements PrimitiveSerializer<CountDto> {
  @override
  final Iterable<Type> types = const [CountDto, _$CountDto];

  @override
  final String wireName = r'CountDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CountDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'count';
    yield serializers.serialize(
      object.count,
      specifiedType: const FullType(num),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CountDto object, {
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
    required CountDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'count':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(num)) as num;
          result.count = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CountDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CountDtoBuilder();
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
