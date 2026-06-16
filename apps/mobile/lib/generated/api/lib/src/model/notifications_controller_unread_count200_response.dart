//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/count_dto.dart';
import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'notifications_controller_unread_count200_response.g.dart';

/// NotificationsControllerUnreadCount200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class NotificationsControllerUnreadCount200Response
    implements
        Built<NotificationsControllerUnreadCount200Response,
            NotificationsControllerUnreadCount200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  CountDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  NotificationsControllerUnreadCount200Response._();

  factory NotificationsControllerUnreadCount200Response(
          [void updates(
              NotificationsControllerUnreadCount200ResponseBuilder b)]) =
      _$NotificationsControllerUnreadCount200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(
          NotificationsControllerUnreadCount200ResponseBuilder b) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<NotificationsControllerUnreadCount200Response>
      get serializer =>
          _$NotificationsControllerUnreadCount200ResponseSerializer();
}

class _$NotificationsControllerUnreadCount200ResponseSerializer
    implements
        PrimitiveSerializer<NotificationsControllerUnreadCount200Response> {
  @override
  final Iterable<Type> types = const [
    NotificationsControllerUnreadCount200Response,
    _$NotificationsControllerUnreadCount200Response
  ];

  @override
  final String wireName = r'NotificationsControllerUnreadCount200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    NotificationsControllerUnreadCount200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(CountDto),
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
    NotificationsControllerUnreadCount200Response object, {
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
    required NotificationsControllerUnreadCount200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CountDto),
          ) as CountDto;
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
  NotificationsControllerUnreadCount200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = NotificationsControllerUnreadCount200ResponseBuilder();
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
