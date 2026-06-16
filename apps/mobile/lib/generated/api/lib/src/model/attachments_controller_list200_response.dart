//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:super_template_api/src/model/attachment_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'attachments_controller_list200_response.g.dart';

/// AttachmentsControllerList200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AttachmentsControllerList200Response
    implements
        Built<AttachmentsControllerList200Response,
            AttachmentsControllerList200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  BuiltList<AttachmentDto> get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AttachmentsControllerList200Response._();

  factory AttachmentsControllerList200Response(
          [void updates(AttachmentsControllerList200ResponseBuilder b)]) =
      _$AttachmentsControllerList200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AttachmentsControllerList200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AttachmentsControllerList200Response> get serializer =>
      _$AttachmentsControllerList200ResponseSerializer();
}

class _$AttachmentsControllerList200ResponseSerializer
    implements PrimitiveSerializer<AttachmentsControllerList200Response> {
  @override
  final Iterable<Type> types = const [
    AttachmentsControllerList200Response,
    _$AttachmentsControllerList200Response
  ];

  @override
  final String wireName = r'AttachmentsControllerList200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AttachmentsControllerList200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(BuiltList, [FullType(AttachmentDto)]),
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
    AttachmentsControllerList200Response object, {
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
    required AttachmentsControllerList200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(AttachmentDto)]),
          ) as BuiltList<AttachmentDto>;
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
  AttachmentsControllerList200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AttachmentsControllerList200ResponseBuilder();
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
