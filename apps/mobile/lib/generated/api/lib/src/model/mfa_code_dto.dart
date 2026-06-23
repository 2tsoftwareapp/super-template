//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'mfa_code_dto.g.dart';

/// MfaCodeDto
///
/// Properties:
/// * [code]
@BuiltValue()
abstract class MfaCodeDto implements Built<MfaCodeDto, MfaCodeDtoBuilder> {
  @BuiltValueField(wireName: r'code')
  String get code;

  MfaCodeDto._();

  factory MfaCodeDto([void updates(MfaCodeDtoBuilder b)]) = _$MfaCodeDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MfaCodeDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MfaCodeDto> get serializer => _$MfaCodeDtoSerializer();
}

class _$MfaCodeDtoSerializer implements PrimitiveSerializer<MfaCodeDto> {
  @override
  final Iterable<Type> types = const [MfaCodeDto, _$MfaCodeDto];

  @override
  final String wireName = r'MfaCodeDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MfaCodeDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'code';
    yield serializers.serialize(
      object.code,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MfaCodeDto object, {
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
    required MfaCodeDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'code':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.code = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MfaCodeDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MfaCodeDtoBuilder();
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
