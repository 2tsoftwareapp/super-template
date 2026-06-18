//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/export_job_dto.dart';
import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'exports_controller_create201_response.g.dart';

/// ExportsControllerCreate201Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class ExportsControllerCreate201Response
    implements
        Built<ExportsControllerCreate201Response,
            ExportsControllerCreate201ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  ExportJobDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  ExportsControllerCreate201Response._();

  factory ExportsControllerCreate201Response([
    void updates(ExportsControllerCreate201ResponseBuilder b),
  ]) = _$ExportsControllerCreate201Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ExportsControllerCreate201ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ExportsControllerCreate201Response> get serializer =>
      _$ExportsControllerCreate201ResponseSerializer();
}

class _$ExportsControllerCreate201ResponseSerializer
    implements PrimitiveSerializer<ExportsControllerCreate201Response> {
  @override
  final Iterable<Type> types = const [
    ExportsControllerCreate201Response,
    _$ExportsControllerCreate201Response,
  ];

  @override
  final String wireName = r'ExportsControllerCreate201Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ExportsControllerCreate201Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(ExportJobDto),
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
    ExportsControllerCreate201Response object, {
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
    required ExportsControllerCreate201ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ExportJobDto),
          ) as ExportJobDto;
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
  ExportsControllerCreate201Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ExportsControllerCreate201ResponseBuilder();
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
