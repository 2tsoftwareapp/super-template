//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/job_dto.dart';
import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_jobs_controller_cancel_job200_response.g.dart';

/// AdminJobsControllerCancelJob200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AdminJobsControllerCancelJob200Response
    implements
        Built<AdminJobsControllerCancelJob200Response,
            AdminJobsControllerCancelJob200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  JobDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AdminJobsControllerCancelJob200Response._();

  factory AdminJobsControllerCancelJob200Response([
    void updates(AdminJobsControllerCancelJob200ResponseBuilder b),
  ]) = _$AdminJobsControllerCancelJob200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminJobsControllerCancelJob200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminJobsControllerCancelJob200Response> get serializer =>
      _$AdminJobsControllerCancelJob200ResponseSerializer();
}

class _$AdminJobsControllerCancelJob200ResponseSerializer
    implements PrimitiveSerializer<AdminJobsControllerCancelJob200Response> {
  @override
  final Iterable<Type> types = const [
    AdminJobsControllerCancelJob200Response,
    _$AdminJobsControllerCancelJob200Response,
  ];

  @override
  final String wireName = r'AdminJobsControllerCancelJob200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminJobsControllerCancelJob200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(JobDto),
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
    AdminJobsControllerCancelJob200Response object, {
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
    required AdminJobsControllerCancelJob200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobDto),
          ) as JobDto;
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
  AdminJobsControllerCancelJob200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminJobsControllerCancelJob200ResponseBuilder();
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
