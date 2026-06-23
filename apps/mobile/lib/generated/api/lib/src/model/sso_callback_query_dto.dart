//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'sso_callback_query_dto.g.dart';

/// SsoCallbackQueryDto
///
/// Properties:
/// * [code]
/// * [state]
@BuiltValue()
abstract class SsoCallbackQueryDto
    implements Built<SsoCallbackQueryDto, SsoCallbackQueryDtoBuilder> {
  @BuiltValueField(wireName: r'code')
  String get code;

  @BuiltValueField(wireName: r'state')
  String get state;

  SsoCallbackQueryDto._();

  factory SsoCallbackQueryDto([void updates(SsoCallbackQueryDtoBuilder b)]) =
      _$SsoCallbackQueryDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SsoCallbackQueryDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SsoCallbackQueryDto> get serializer =>
      _$SsoCallbackQueryDtoSerializer();
}

class _$SsoCallbackQueryDtoSerializer
    implements PrimitiveSerializer<SsoCallbackQueryDto> {
  @override
  final Iterable<Type> types = const [
    SsoCallbackQueryDto,
    _$SsoCallbackQueryDto,
  ];

  @override
  final String wireName = r'SsoCallbackQueryDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SsoCallbackQueryDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'code';
    yield serializers.serialize(
      object.code,
      specifiedType: const FullType(String),
    );
    yield r'state';
    yield serializers.serialize(
      object.state,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SsoCallbackQueryDto object, {
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
    required SsoCallbackQueryDtoBuilder result,
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
        case r'state':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.state = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SsoCallbackQueryDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SsoCallbackQueryDtoBuilder();
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
