//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/device_token_dto.dart';
import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'notifications_controller_register_device201_response.g.dart';

/// NotificationsControllerRegisterDevice201Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class NotificationsControllerRegisterDevice201Response
    implements
        Built<NotificationsControllerRegisterDevice201Response,
            NotificationsControllerRegisterDevice201ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  DeviceTokenDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  NotificationsControllerRegisterDevice201Response._();

  factory NotificationsControllerRegisterDevice201Response([
    void updates(NotificationsControllerRegisterDevice201ResponseBuilder b),
  ]) = _$NotificationsControllerRegisterDevice201Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(
    NotificationsControllerRegisterDevice201ResponseBuilder b,
  ) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<NotificationsControllerRegisterDevice201Response>
      get serializer =>
          _$NotificationsControllerRegisterDevice201ResponseSerializer();
}

class _$NotificationsControllerRegisterDevice201ResponseSerializer
    implements
        PrimitiveSerializer<NotificationsControllerRegisterDevice201Response> {
  @override
  final Iterable<Type> types = const [
    NotificationsControllerRegisterDevice201Response,
    _$NotificationsControllerRegisterDevice201Response,
  ];

  @override
  final String wireName = r'NotificationsControllerRegisterDevice201Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    NotificationsControllerRegisterDevice201Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(DeviceTokenDto),
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
    NotificationsControllerRegisterDevice201Response object, {
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
    required NotificationsControllerRegisterDevice201ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DeviceTokenDto),
          ) as DeviceTokenDto;
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
  NotificationsControllerRegisterDevice201Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = NotificationsControllerRegisterDevice201ResponseBuilder();
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
