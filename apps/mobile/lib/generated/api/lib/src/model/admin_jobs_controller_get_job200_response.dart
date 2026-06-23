//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/job_dto.dart';
import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_jobs_controller_get_job200_response.g.dart';

/// AdminJobsControllerGetJob200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AdminJobsControllerGetJob200Response
    implements
        Built<AdminJobsControllerGetJob200Response,
            AdminJobsControllerGetJob200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  JobDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AdminJobsControllerGetJob200Response._();

  factory AdminJobsControllerGetJob200Response([
    void updates(AdminJobsControllerGetJob200ResponseBuilder b),
  ]) = _$AdminJobsControllerGetJob200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminJobsControllerGetJob200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminJobsControllerGetJob200Response> get serializer =>
      _$AdminJobsControllerGetJob200ResponseSerializer();
}

class _$AdminJobsControllerGetJob200ResponseSerializer
    implements PrimitiveSerializer<AdminJobsControllerGetJob200Response> {
  @override
  final Iterable<Type> types = const [
    AdminJobsControllerGetJob200Response,
    _$AdminJobsControllerGetJob200Response,
  ];

  @override
  final String wireName = r'AdminJobsControllerGetJob200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminJobsControllerGetJob200Response object, {
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
    AdminJobsControllerGetJob200Response object, {
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
    required AdminJobsControllerGetJob200ResponseBuilder result,
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
  AdminJobsControllerGetJob200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminJobsControllerGetJob200ResponseBuilder();
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
