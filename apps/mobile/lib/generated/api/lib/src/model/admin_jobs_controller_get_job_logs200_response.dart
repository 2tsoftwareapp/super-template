//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:super_template_api/src/model/pagination_meta_dto.dart';
import 'package:super_template_api/src/model/job_event_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_jobs_controller_get_job_logs200_response.g.dart';

/// AdminJobsControllerGetJobLogs200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AdminJobsControllerGetJobLogs200Response
    implements
        Built<AdminJobsControllerGetJobLogs200Response,
            AdminJobsControllerGetJobLogs200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  BuiltList<JobEventDto> get data;

  @BuiltValueField(wireName: r'meta')
  PaginationMetaDto get meta;

  AdminJobsControllerGetJobLogs200Response._();

  factory AdminJobsControllerGetJobLogs200Response([
    void updates(AdminJobsControllerGetJobLogs200ResponseBuilder b),
  ]) = _$AdminJobsControllerGetJobLogs200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminJobsControllerGetJobLogs200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminJobsControllerGetJobLogs200Response> get serializer =>
      _$AdminJobsControllerGetJobLogs200ResponseSerializer();
}

class _$AdminJobsControllerGetJobLogs200ResponseSerializer
    implements PrimitiveSerializer<AdminJobsControllerGetJobLogs200Response> {
  @override
  final Iterable<Type> types = const [
    AdminJobsControllerGetJobLogs200Response,
    _$AdminJobsControllerGetJobLogs200Response,
  ];

  @override
  final String wireName = r'AdminJobsControllerGetJobLogs200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminJobsControllerGetJobLogs200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(BuiltList, [FullType(JobEventDto)]),
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
    AdminJobsControllerGetJobLogs200Response object, {
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
    required AdminJobsControllerGetJobLogs200ResponseBuilder result,
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
              FullType(JobEventDto),
            ]),
          ) as BuiltList<JobEventDto>;
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
  AdminJobsControllerGetJobLogs200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminJobsControllerGetJobLogs200ResponseBuilder();
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
