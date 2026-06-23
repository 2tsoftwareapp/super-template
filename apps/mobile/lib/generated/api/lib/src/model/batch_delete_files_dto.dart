//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'batch_delete_files_dto.g.dart';

/// BatchDeleteFilesDto
///
/// Properties:
/// * [fileIds]
/// * [idempotencyKey] - Replaying the same key returns the original result instead of re-running the batch.
@BuiltValue()
abstract class BatchDeleteFilesDto
    implements Built<BatchDeleteFilesDto, BatchDeleteFilesDtoBuilder> {
  @BuiltValueField(wireName: r'fileIds')
  BuiltList<String> get fileIds;

  /// Replaying the same key returns the original result instead of re-running the batch.
  @BuiltValueField(wireName: r'idempotencyKey')
  String? get idempotencyKey;

  BatchDeleteFilesDto._();

  factory BatchDeleteFilesDto([void updates(BatchDeleteFilesDtoBuilder b)]) =
      _$BatchDeleteFilesDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(BatchDeleteFilesDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<BatchDeleteFilesDto> get serializer =>
      _$BatchDeleteFilesDtoSerializer();
}

class _$BatchDeleteFilesDtoSerializer
    implements PrimitiveSerializer<BatchDeleteFilesDto> {
  @override
  final Iterable<Type> types = const [
    BatchDeleteFilesDto,
    _$BatchDeleteFilesDto,
  ];

  @override
  final String wireName = r'BatchDeleteFilesDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    BatchDeleteFilesDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'fileIds';
    yield serializers.serialize(
      object.fileIds,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    if (object.idempotencyKey != null) {
      yield r'idempotencyKey';
      yield serializers.serialize(
        object.idempotencyKey,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    BatchDeleteFilesDto object, {
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
    required BatchDeleteFilesDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'fileIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [
              FullType(String),
            ]),
          ) as BuiltList<String>;
          result.fileIds.replace(valueDes);
          break;
        case r'idempotencyKey':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.idempotencyKey = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  BatchDeleteFilesDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = BatchDeleteFilesDtoBuilder();
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
