//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/file_url_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'files_controller_get_url200_response.g.dart';

/// FilesControllerGetUrl200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class FilesControllerGetUrl200Response
    implements
        Built<FilesControllerGetUrl200Response,
            FilesControllerGetUrl200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  FileUrlDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  FilesControllerGetUrl200Response._();

  factory FilesControllerGetUrl200Response([
    void updates(FilesControllerGetUrl200ResponseBuilder b),
  ]) = _$FilesControllerGetUrl200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FilesControllerGetUrl200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FilesControllerGetUrl200Response> get serializer =>
      _$FilesControllerGetUrl200ResponseSerializer();
}

class _$FilesControllerGetUrl200ResponseSerializer
    implements PrimitiveSerializer<FilesControllerGetUrl200Response> {
  @override
  final Iterable<Type> types = const [
    FilesControllerGetUrl200Response,
    _$FilesControllerGetUrl200Response,
  ];

  @override
  final String wireName = r'FilesControllerGetUrl200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FilesControllerGetUrl200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(FileUrlDto),
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
    FilesControllerGetUrl200Response object, {
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
    required FilesControllerGetUrl200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(FileUrlDto),
          ) as FileUrlDto;
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
  FilesControllerGetUrl200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FilesControllerGetUrl200ResponseBuilder();
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
