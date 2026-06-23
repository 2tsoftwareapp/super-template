//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:super_template_api/src/model/file_history_event_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'files_controller_get_history200_response.g.dart';

/// FilesControllerGetHistory200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class FilesControllerGetHistory200Response
    implements
        Built<FilesControllerGetHistory200Response,
            FilesControllerGetHistory200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  BuiltList<FileHistoryEventDto> get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  FilesControllerGetHistory200Response._();

  factory FilesControllerGetHistory200Response([
    void updates(FilesControllerGetHistory200ResponseBuilder b),
  ]) = _$FilesControllerGetHistory200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FilesControllerGetHistory200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FilesControllerGetHistory200Response> get serializer =>
      _$FilesControllerGetHistory200ResponseSerializer();
}

class _$FilesControllerGetHistory200ResponseSerializer
    implements PrimitiveSerializer<FilesControllerGetHistory200Response> {
  @override
  final Iterable<Type> types = const [
    FilesControllerGetHistory200Response,
    _$FilesControllerGetHistory200Response,
  ];

  @override
  final String wireName = r'FilesControllerGetHistory200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FilesControllerGetHistory200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(BuiltList, [FullType(FileHistoryEventDto)]),
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
    FilesControllerGetHistory200Response object, {
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
    required FilesControllerGetHistory200ResponseBuilder result,
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
              FullType(FileHistoryEventDto),
            ]),
          ) as BuiltList<FileHistoryEventDto>;
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
  FilesControllerGetHistory200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FilesControllerGetHistory200ResponseBuilder();
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
