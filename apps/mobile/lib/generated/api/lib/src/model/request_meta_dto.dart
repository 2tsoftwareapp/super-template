//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'request_meta_dto.g.dart';

/// RequestMetaDto
///
/// Properties:
/// * [requestId]
@BuiltValue()
abstract class RequestMetaDto
    implements Built<RequestMetaDto, RequestMetaDtoBuilder> {
  @BuiltValueField(wireName: r'requestId')
  String get requestId;

  RequestMetaDto._();

  factory RequestMetaDto([void updates(RequestMetaDtoBuilder b)]) =
      _$RequestMetaDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RequestMetaDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RequestMetaDto> get serializer =>
      _$RequestMetaDtoSerializer();
}

class _$RequestMetaDtoSerializer
    implements PrimitiveSerializer<RequestMetaDto> {
  @override
  final Iterable<Type> types = const [RequestMetaDto, _$RequestMetaDto];

  @override
  final String wireName = r'RequestMetaDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RequestMetaDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'requestId';
    yield serializers.serialize(
      object.requestId,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    RequestMetaDto object, {
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
    required RequestMetaDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'requestId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.requestId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  RequestMetaDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RequestMetaDtoBuilder();
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
