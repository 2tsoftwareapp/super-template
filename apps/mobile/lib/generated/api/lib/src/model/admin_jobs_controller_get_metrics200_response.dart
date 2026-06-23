//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/job_metrics_dto.dart';
import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_jobs_controller_get_metrics200_response.g.dart';

/// AdminJobsControllerGetMetrics200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AdminJobsControllerGetMetrics200Response
    implements
        Built<AdminJobsControllerGetMetrics200Response,
            AdminJobsControllerGetMetrics200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  JobMetricsDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AdminJobsControllerGetMetrics200Response._();

  factory AdminJobsControllerGetMetrics200Response([
    void updates(AdminJobsControllerGetMetrics200ResponseBuilder b),
  ]) = _$AdminJobsControllerGetMetrics200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminJobsControllerGetMetrics200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminJobsControllerGetMetrics200Response> get serializer =>
      _$AdminJobsControllerGetMetrics200ResponseSerializer();
}

class _$AdminJobsControllerGetMetrics200ResponseSerializer
    implements PrimitiveSerializer<AdminJobsControllerGetMetrics200Response> {
  @override
  final Iterable<Type> types = const [
    AdminJobsControllerGetMetrics200Response,
    _$AdminJobsControllerGetMetrics200Response,
  ];

  @override
  final String wireName = r'AdminJobsControllerGetMetrics200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminJobsControllerGetMetrics200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(JobMetricsDto),
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
    AdminJobsControllerGetMetrics200Response object, {
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
    required AdminJobsControllerGetMetrics200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobMetricsDto),
          ) as JobMetricsDto;
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
  AdminJobsControllerGetMetrics200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminJobsControllerGetMetrics200ResponseBuilder();
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
