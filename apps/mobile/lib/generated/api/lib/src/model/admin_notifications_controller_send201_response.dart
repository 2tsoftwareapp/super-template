//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/notification_job_dto.dart';
import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_notifications_controller_send201_response.g.dart';

/// AdminNotificationsControllerSend201Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AdminNotificationsControllerSend201Response
    implements
        Built<AdminNotificationsControllerSend201Response,
            AdminNotificationsControllerSend201ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  NotificationJobDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AdminNotificationsControllerSend201Response._();

  factory AdminNotificationsControllerSend201Response([
    void updates(AdminNotificationsControllerSend201ResponseBuilder b),
  ]) = _$AdminNotificationsControllerSend201Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminNotificationsControllerSend201ResponseBuilder b) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminNotificationsControllerSend201Response>
      get serializer =>
          _$AdminNotificationsControllerSend201ResponseSerializer();
}

class _$AdminNotificationsControllerSend201ResponseSerializer
    implements
        PrimitiveSerializer<AdminNotificationsControllerSend201Response> {
  @override
  final Iterable<Type> types = const [
    AdminNotificationsControllerSend201Response,
    _$AdminNotificationsControllerSend201Response,
  ];

  @override
  final String wireName = r'AdminNotificationsControllerSend201Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminNotificationsControllerSend201Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(NotificationJobDto),
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
    AdminNotificationsControllerSend201Response object, {
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
    required AdminNotificationsControllerSend201ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(NotificationJobDto),
          ) as NotificationJobDto;
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
  AdminNotificationsControllerSend201Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminNotificationsControllerSend201ResponseBuilder();
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
