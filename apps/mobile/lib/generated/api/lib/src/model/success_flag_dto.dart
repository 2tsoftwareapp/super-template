//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'success_flag_dto.g.dart';

/// SuccessFlagDto
///
/// Properties:
/// * [success]
@BuiltValue()
abstract class SuccessFlagDto
    implements Built<SuccessFlagDto, SuccessFlagDtoBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  SuccessFlagDto._();

  factory SuccessFlagDto([void updates(SuccessFlagDtoBuilder b)]) =
      _$SuccessFlagDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SuccessFlagDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SuccessFlagDto> get serializer =>
      _$SuccessFlagDtoSerializer();
}

class _$SuccessFlagDtoSerializer
    implements PrimitiveSerializer<SuccessFlagDto> {
  @override
  final Iterable<Type> types = const [SuccessFlagDto, _$SuccessFlagDto];

  @override
  final String wireName = r'SuccessFlagDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SuccessFlagDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'success';
    yield serializers.serialize(
      object.success,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SuccessFlagDto object, {
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
    required SuccessFlagDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'success':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.success = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SuccessFlagDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SuccessFlagDtoBuilder();
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
