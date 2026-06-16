//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/mail_preview_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_mail_controller_preview200_response.g.dart';

/// AdminMailControllerPreview200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AdminMailControllerPreview200Response
    implements
        Built<AdminMailControllerPreview200Response,
            AdminMailControllerPreview200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  MailPreviewDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AdminMailControllerPreview200Response._();

  factory AdminMailControllerPreview200Response(
          [void updates(AdminMailControllerPreview200ResponseBuilder b)]) =
      _$AdminMailControllerPreview200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminMailControllerPreview200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminMailControllerPreview200Response> get serializer =>
      _$AdminMailControllerPreview200ResponseSerializer();
}

class _$AdminMailControllerPreview200ResponseSerializer
    implements PrimitiveSerializer<AdminMailControllerPreview200Response> {
  @override
  final Iterable<Type> types = const [
    AdminMailControllerPreview200Response,
    _$AdminMailControllerPreview200Response
  ];

  @override
  final String wireName = r'AdminMailControllerPreview200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminMailControllerPreview200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(MailPreviewDto),
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
    AdminMailControllerPreview200Response object, {
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
    required AdminMailControllerPreview200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MailPreviewDto),
          ) as MailPreviewDto;
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
  AdminMailControllerPreview200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminMailControllerPreview200ResponseBuilder();
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
