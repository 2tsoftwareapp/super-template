//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/attachment_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'attachments_controller_attach201_response.g.dart';

/// AttachmentsControllerAttach201Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AttachmentsControllerAttach201Response
    implements
        Built<AttachmentsControllerAttach201Response,
            AttachmentsControllerAttach201ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  AttachmentDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AttachmentsControllerAttach201Response._();

  factory AttachmentsControllerAttach201Response([
    void updates(AttachmentsControllerAttach201ResponseBuilder b),
  ]) = _$AttachmentsControllerAttach201Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AttachmentsControllerAttach201ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AttachmentsControllerAttach201Response> get serializer =>
      _$AttachmentsControllerAttach201ResponseSerializer();
}

class _$AttachmentsControllerAttach201ResponseSerializer
    implements PrimitiveSerializer<AttachmentsControllerAttach201Response> {
  @override
  final Iterable<Type> types = const [
    AttachmentsControllerAttach201Response,
    _$AttachmentsControllerAttach201Response,
  ];

  @override
  final String wireName = r'AttachmentsControllerAttach201Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AttachmentsControllerAttach201Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(AttachmentDto),
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
    AttachmentsControllerAttach201Response object, {
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
    required AttachmentsControllerAttach201ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(AttachmentDto),
          ) as AttachmentDto;
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
  AttachmentsControllerAttach201Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AttachmentsControllerAttach201ResponseBuilder();
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
