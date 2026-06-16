//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:super_template_api/src/model/notification_dto.dart';
import 'package:super_template_api/src/model/pagination_meta_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'notifications_controller_list200_response.g.dart';

/// NotificationsControllerList200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class NotificationsControllerList200Response
    implements
        Built<NotificationsControllerList200Response,
            NotificationsControllerList200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  BuiltList<NotificationDto> get data;

  @BuiltValueField(wireName: r'meta')
  PaginationMetaDto get meta;

  NotificationsControllerList200Response._();

  factory NotificationsControllerList200Response(
          [void updates(NotificationsControllerList200ResponseBuilder b)]) =
      _$NotificationsControllerList200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(NotificationsControllerList200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<NotificationsControllerList200Response> get serializer =>
      _$NotificationsControllerList200ResponseSerializer();
}

class _$NotificationsControllerList200ResponseSerializer
    implements PrimitiveSerializer<NotificationsControllerList200Response> {
  @override
  final Iterable<Type> types = const [
    NotificationsControllerList200Response,
    _$NotificationsControllerList200Response
  ];

  @override
  final String wireName = r'NotificationsControllerList200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    NotificationsControllerList200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(BuiltList, [FullType(NotificationDto)]),
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
    NotificationsControllerList200Response object, {
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
    required NotificationsControllerList200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType:
                const FullType(BuiltList, [FullType(NotificationDto)]),
          ) as BuiltList<NotificationDto>;
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
  NotificationsControllerList200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = NotificationsControllerList200ResponseBuilder();
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
