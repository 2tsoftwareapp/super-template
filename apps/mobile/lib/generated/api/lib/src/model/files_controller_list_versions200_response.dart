//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:super_template_api/src/model/file_version_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'files_controller_list_versions200_response.g.dart';

/// FilesControllerListVersions200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class FilesControllerListVersions200Response
    implements
        Built<FilesControllerListVersions200Response,
            FilesControllerListVersions200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  BuiltList<FileVersionDto> get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  FilesControllerListVersions200Response._();

  factory FilesControllerListVersions200Response([
    void updates(FilesControllerListVersions200ResponseBuilder b),
  ]) = _$FilesControllerListVersions200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FilesControllerListVersions200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FilesControllerListVersions200Response> get serializer =>
      _$FilesControllerListVersions200ResponseSerializer();
}

class _$FilesControllerListVersions200ResponseSerializer
    implements PrimitiveSerializer<FilesControllerListVersions200Response> {
  @override
  final Iterable<Type> types = const [
    FilesControllerListVersions200Response,
    _$FilesControllerListVersions200Response,
  ];

  @override
  final String wireName = r'FilesControllerListVersions200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FilesControllerListVersions200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(BuiltList, [FullType(FileVersionDto)]),
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
    FilesControllerListVersions200Response object, {
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
    required FilesControllerListVersions200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [
              FullType(FileVersionDto),
            ]),
          ) as BuiltList<FileVersionDto>;
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
  FilesControllerListVersions200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FilesControllerListVersions200ResponseBuilder();
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
