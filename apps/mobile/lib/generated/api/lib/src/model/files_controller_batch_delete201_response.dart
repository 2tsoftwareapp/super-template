//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/batch_delete_result_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'files_controller_batch_delete201_response.g.dart';

/// FilesControllerBatchDelete201Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class FilesControllerBatchDelete201Response
    implements
        Built<FilesControllerBatchDelete201Response,
            FilesControllerBatchDelete201ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  BatchDeleteResultDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  FilesControllerBatchDelete201Response._();

  factory FilesControllerBatchDelete201Response([
    void updates(FilesControllerBatchDelete201ResponseBuilder b),
  ]) = _$FilesControllerBatchDelete201Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FilesControllerBatchDelete201ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FilesControllerBatchDelete201Response> get serializer =>
      _$FilesControllerBatchDelete201ResponseSerializer();
}

class _$FilesControllerBatchDelete201ResponseSerializer
    implements PrimitiveSerializer<FilesControllerBatchDelete201Response> {
  @override
  final Iterable<Type> types = const [
    FilesControllerBatchDelete201Response,
    _$FilesControllerBatchDelete201Response,
  ];

  @override
  final String wireName = r'FilesControllerBatchDelete201Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FilesControllerBatchDelete201Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(BatchDeleteResultDto),
    );
    yield r'meta';
    yield serializers.serialize(
      object.meta,
      specifiedType: const FullType(RequestMetaDto),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    FilesControllerBatchDelete201Response object, {
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
    required FilesControllerBatchDelete201ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BatchDeleteResultDto),
          ) as BatchDeleteResultDto;
          result.data.replace(valueDes);
          break;
        case r'meta':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(RequestMetaDto),
          ) as RequestMetaDto;
          result.meta.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  FilesControllerBatchDelete201Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FilesControllerBatchDelete201ResponseBuilder();
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
