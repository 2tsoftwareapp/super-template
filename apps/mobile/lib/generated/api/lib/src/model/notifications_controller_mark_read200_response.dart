//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/notification_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'notifications_controller_mark_read200_response.g.dart';

/// NotificationsControllerMarkRead200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class NotificationsControllerMarkRead200Response
    implements
        Built<NotificationsControllerMarkRead200Response,
            NotificationsControllerMarkRead200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  NotificationDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  NotificationsControllerMarkRead200Response._();

  factory NotificationsControllerMarkRead200Response([
    void updates(NotificationsControllerMarkRead200ResponseBuilder b),
  ]) = _$NotificationsControllerMarkRead200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(NotificationsControllerMarkRead200ResponseBuilder b) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<NotificationsControllerMarkRead200Response>
      get serializer =>
          _$NotificationsControllerMarkRead200ResponseSerializer();
}

class _$NotificationsControllerMarkRead200ResponseSerializer
    implements PrimitiveSerializer<NotificationsControllerMarkRead200Response> {
  @override
  final Iterable<Type> types = const [
    NotificationsControllerMarkRead200Response,
    _$NotificationsControllerMarkRead200Response,
  ];

  @override
  final String wireName = r'NotificationsControllerMarkRead200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    NotificationsControllerMarkRead200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(NotificationDto),
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
    NotificationsControllerMarkRead200Response object, {
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
    required NotificationsControllerMarkRead200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(NotificationDto),
          ) as NotificationDto;
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
  NotificationsControllerMarkRead200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = NotificationsControllerMarkRead200ResponseBuilder();
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
