//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/notification_job_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:super_template_api/src/model/pagination_meta_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_notifications_controller_list_jobs200_response.g.dart';

/// AdminNotificationsControllerListJobs200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AdminNotificationsControllerListJobs200Response
    implements
        Built<AdminNotificationsControllerListJobs200Response,
            AdminNotificationsControllerListJobs200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  BuiltList<NotificationJobDto> get data;

  @BuiltValueField(wireName: r'meta')
  PaginationMetaDto get meta;

  AdminNotificationsControllerListJobs200Response._();

  factory AdminNotificationsControllerListJobs200Response(
          [void updates(
              AdminNotificationsControllerListJobs200ResponseBuilder b)]) =
      _$AdminNotificationsControllerListJobs200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(
          AdminNotificationsControllerListJobs200ResponseBuilder b) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminNotificationsControllerListJobs200Response>
      get serializer =>
          _$AdminNotificationsControllerListJobs200ResponseSerializer();
}

class _$AdminNotificationsControllerListJobs200ResponseSerializer
    implements
        PrimitiveSerializer<AdminNotificationsControllerListJobs200Response> {
  @override
  final Iterable<Type> types = const [
    AdminNotificationsControllerListJobs200Response,
    _$AdminNotificationsControllerListJobs200Response
  ];

  @override
  final String wireName = r'AdminNotificationsControllerListJobs200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminNotificationsControllerListJobs200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(BuiltList, [FullType(NotificationJobDto)]),
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
    AdminNotificationsControllerListJobs200Response object, {
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
    required AdminNotificationsControllerListJobs200ResponseBuilder result,
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
                const FullType(BuiltList, [FullType(NotificationJobDto)]),
          ) as BuiltList<NotificationJobDto>;
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
  AdminNotificationsControllerListJobs200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminNotificationsControllerListJobs200ResponseBuilder();
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
