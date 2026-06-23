//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/batch_delete_result_item_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'batch_delete_result_dto.g.dart';

/// BatchDeleteResultDto
///
/// Properties:
/// * [results]
@BuiltValue()
abstract class BatchDeleteResultDto
    implements Built<BatchDeleteResultDto, BatchDeleteResultDtoBuilder> {
  @BuiltValueField(wireName: r'results')
  BuiltList<BatchDeleteResultItemDto> get results;

  BatchDeleteResultDto._();

  factory BatchDeleteResultDto([void updates(BatchDeleteResultDtoBuilder b)]) =
      _$BatchDeleteResultDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(BatchDeleteResultDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<BatchDeleteResultDto> get serializer =>
      _$BatchDeleteResultDtoSerializer();
}

class _$BatchDeleteResultDtoSerializer
    implements PrimitiveSerializer<BatchDeleteResultDto> {
  @override
  final Iterable<Type> types = const [
    BatchDeleteResultDto,
    _$BatchDeleteResultDto,
  ];

  @override
  final String wireName = r'BatchDeleteResultDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    BatchDeleteResultDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'results';
    yield serializers.serialize(
      object.results,
      specifiedType: const FullType(BuiltList, [
        FullType(BatchDeleteResultItemDto),
      ]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    BatchDeleteResultDto object, {
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
    required BatchDeleteResultDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'results':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [
              FullType(BatchDeleteResultItemDto),
            ]),
          ) as BuiltList<BatchDeleteResultItemDto>;
          result.results.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  BatchDeleteResultDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = BatchDeleteResultDtoBuilder();
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
