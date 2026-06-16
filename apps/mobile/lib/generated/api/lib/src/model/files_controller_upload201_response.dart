//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/file_dto.dart';
import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'files_controller_upload201_response.g.dart';

/// FilesControllerUpload201Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class FilesControllerUpload201Response
    implements
        Built<FilesControllerUpload201Response,
            FilesControllerUpload201ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  FileDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  FilesControllerUpload201Response._();

  factory FilesControllerUpload201Response(
          [void updates(FilesControllerUpload201ResponseBuilder b)]) =
      _$FilesControllerUpload201Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FilesControllerUpload201ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FilesControllerUpload201Response> get serializer =>
      _$FilesControllerUpload201ResponseSerializer();
}

class _$FilesControllerUpload201ResponseSerializer
    implements PrimitiveSerializer<FilesControllerUpload201Response> {
  @override
  final Iterable<Type> types = const [
    FilesControllerUpload201Response,
    _$FilesControllerUpload201Response
  ];

  @override
  final String wireName = r'FilesControllerUpload201Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FilesControllerUpload201Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(FileDto),
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
    FilesControllerUpload201Response object, {
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
    required FilesControllerUpload201ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(FileDto),
          ) as FileDto;
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
  FilesControllerUpload201Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FilesControllerUpload201ResponseBuilder();
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
