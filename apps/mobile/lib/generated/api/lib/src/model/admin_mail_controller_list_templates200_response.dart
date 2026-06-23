//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/mail_template_dto.dart';
import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_mail_controller_list_templates200_response.g.dart';

/// AdminMailControllerListTemplates200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AdminMailControllerListTemplates200Response
    implements
        Built<AdminMailControllerListTemplates200Response,
            AdminMailControllerListTemplates200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  BuiltList<MailTemplateDto> get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AdminMailControllerListTemplates200Response._();

  factory AdminMailControllerListTemplates200Response([
    void updates(AdminMailControllerListTemplates200ResponseBuilder b),
  ]) = _$AdminMailControllerListTemplates200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminMailControllerListTemplates200ResponseBuilder b) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminMailControllerListTemplates200Response>
      get serializer =>
          _$AdminMailControllerListTemplates200ResponseSerializer();
}

class _$AdminMailControllerListTemplates200ResponseSerializer
    implements
        PrimitiveSerializer<AdminMailControllerListTemplates200Response> {
  @override
  final Iterable<Type> types = const [
    AdminMailControllerListTemplates200Response,
    _$AdminMailControllerListTemplates200Response,
  ];

  @override
  final String wireName = r'AdminMailControllerListTemplates200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminMailControllerListTemplates200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(BuiltList, [FullType(MailTemplateDto)]),
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
    AdminMailControllerListTemplates200Response object, {
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
    required AdminMailControllerListTemplates200ResponseBuilder result,
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
              FullType(MailTemplateDto),
            ]),
          ) as BuiltList<MailTemplateDto>;
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
  AdminMailControllerListTemplates200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminMailControllerListTemplates200ResponseBuilder();
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
