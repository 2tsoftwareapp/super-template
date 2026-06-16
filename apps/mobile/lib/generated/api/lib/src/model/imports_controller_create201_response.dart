//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/import_job_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'imports_controller_create201_response.g.dart';

/// ImportsControllerCreate201Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class ImportsControllerCreate201Response
    implements
        Built<ImportsControllerCreate201Response,
            ImportsControllerCreate201ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  ImportJobDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  ImportsControllerCreate201Response._();

  factory ImportsControllerCreate201Response(
          [void updates(ImportsControllerCreate201ResponseBuilder b)]) =
      _$ImportsControllerCreate201Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ImportsControllerCreate201ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ImportsControllerCreate201Response> get serializer =>
      _$ImportsControllerCreate201ResponseSerializer();
}

class _$ImportsControllerCreate201ResponseSerializer
    implements PrimitiveSerializer<ImportsControllerCreate201Response> {
  @override
  final Iterable<Type> types = const [
    ImportsControllerCreate201Response,
    _$ImportsControllerCreate201Response
  ];

  @override
  final String wireName = r'ImportsControllerCreate201Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ImportsControllerCreate201Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(ImportJobDto),
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
    ImportsControllerCreate201Response object, {
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
    required ImportsControllerCreate201ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ImportJobDto),
          ) as ImportJobDto;
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
  ImportsControllerCreate201Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ImportsControllerCreate201ResponseBuilder();
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
