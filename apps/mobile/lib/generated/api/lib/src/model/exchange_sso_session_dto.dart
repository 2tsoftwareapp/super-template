//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'exchange_sso_session_dto.g.dart';

/// ExchangeSsoSessionDto
///
/// Properties:
/// * [code]
@BuiltValue()
abstract class ExchangeSsoSessionDto
    implements Built<ExchangeSsoSessionDto, ExchangeSsoSessionDtoBuilder> {
  @BuiltValueField(wireName: r'code')
  String get code;

  ExchangeSsoSessionDto._();

  factory ExchangeSsoSessionDto([
    void updates(ExchangeSsoSessionDtoBuilder b),
  ]) = _$ExchangeSsoSessionDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ExchangeSsoSessionDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ExchangeSsoSessionDto> get serializer =>
      _$ExchangeSsoSessionDtoSerializer();
}

class _$ExchangeSsoSessionDtoSerializer
    implements PrimitiveSerializer<ExchangeSsoSessionDto> {
  @override
  final Iterable<Type> types = const [
    ExchangeSsoSessionDto,
    _$ExchangeSsoSessionDto,
  ];

  @override
  final String wireName = r'ExchangeSsoSessionDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ExchangeSsoSessionDto object, {
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
    ExchangeSsoSessionDto object, {
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
    required ExchangeSsoSessionDtoBuilder result,
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
  ExchangeSsoSessionDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ExchangeSsoSessionDtoBuilder();
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
