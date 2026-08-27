//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'batch_delete_result_item_dto.g.dart';

/// BatchDeleteResultItemDto
///
/// Properties:
/// * [error]
/// * [fileId]
/// * [success]
@BuiltValue()
abstract class BatchDeleteResultItemDto
    implements
        Built<BatchDeleteResultItemDto, BatchDeleteResultItemDtoBuilder> {
  @BuiltValueField(wireName: r'error')
  String? get error;

  @BuiltValueField(wireName: r'fileId')
  String get fileId;

  @BuiltValueField(wireName: r'success')
  bool get success;

  BatchDeleteResultItemDto._();

  factory BatchDeleteResultItemDto([
    void updates(BatchDeleteResultItemDtoBuilder b),
  ]) = _$BatchDeleteResultItemDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(BatchDeleteResultItemDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<BatchDeleteResultItemDto> get serializer =>
      _$BatchDeleteResultItemDtoSerializer();
}

class _$BatchDeleteResultItemDtoSerializer
    implements PrimitiveSerializer<BatchDeleteResultItemDto> {
  @override
  final Iterable<Type> types = const [
    BatchDeleteResultItemDto,
    _$BatchDeleteResultItemDto,
  ];

  @override
  final String wireName = r'BatchDeleteResultItemDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    BatchDeleteResultItemDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.error != null) {
      yield r'error';
      yield serializers.serialize(
        object.error,
        specifiedType: const FullType.nullable(String),
      );
    }
    yield r'fileId';
    yield serializers.serialize(
      object.fileId,
      specifiedType: const FullType(String),
    );
    yield r'success';
    yield serializers.serialize(
      object.success,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    BatchDeleteResultItemDto object, {
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
    required BatchDeleteResultItemDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'error':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.error = valueDes;
          break;
        case r'fileId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.fileId = valueDes;
          break;
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
  BatchDeleteResultItemDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = BatchDeleteResultItemDtoBuilder();
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
