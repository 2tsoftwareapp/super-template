//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:super_template_api/src/model/mail_delivery_dto.dart';
import 'package:super_template_api/src/model/pagination_meta_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_mail_controller_list_deliveries200_response.g.dart';

/// AdminMailControllerListDeliveries200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AdminMailControllerListDeliveries200Response
    implements
        Built<AdminMailControllerListDeliveries200Response,
            AdminMailControllerListDeliveries200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  BuiltList<MailDeliveryDto> get data;

  @BuiltValueField(wireName: r'meta')
  PaginationMetaDto get meta;

  AdminMailControllerListDeliveries200Response._();

  factory AdminMailControllerListDeliveries200Response([
    void updates(AdminMailControllerListDeliveries200ResponseBuilder b),
  ]) = _$AdminMailControllerListDeliveries200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(
    AdminMailControllerListDeliveries200ResponseBuilder b,
  ) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminMailControllerListDeliveries200Response>
      get serializer =>
          _$AdminMailControllerListDeliveries200ResponseSerializer();
}

class _$AdminMailControllerListDeliveries200ResponseSerializer
    implements
        PrimitiveSerializer<AdminMailControllerListDeliveries200Response> {
  @override
  final Iterable<Type> types = const [
    AdminMailControllerListDeliveries200Response,
    _$AdminMailControllerListDeliveries200Response,
  ];

  @override
  final String wireName = r'AdminMailControllerListDeliveries200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminMailControllerListDeliveries200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(BuiltList, [FullType(MailDeliveryDto)]),
    );
    yield r'meta';
    yield serializers.serialize(
      object.meta,
      specifiedType: const FullType(PaginationMetaDto),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AdminMailControllerListDeliveries200Response object, {
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
    required AdminMailControllerListDeliveries200ResponseBuilder result,
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
              FullType(MailDeliveryDto),
            ]),
          ) as BuiltList<MailDeliveryDto>;
          result.data.replace(valueDes);
          break;
        case r'meta':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(PaginationMetaDto),
          ) as PaginationMetaDto;
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
  AdminMailControllerListDeliveries200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminMailControllerListDeliveries200ResponseBuilder();
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
