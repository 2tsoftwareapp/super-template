//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/job_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:super_template_api/src/model/pagination_meta_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_jobs_controller_list_jobs200_response.g.dart';

/// AdminJobsControllerListJobs200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AdminJobsControllerListJobs200Response
    implements
        Built<AdminJobsControllerListJobs200Response,
            AdminJobsControllerListJobs200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  BuiltList<JobDto> get data;

  @BuiltValueField(wireName: r'meta')
  PaginationMetaDto get meta;

  AdminJobsControllerListJobs200Response._();

  factory AdminJobsControllerListJobs200Response([
    void updates(AdminJobsControllerListJobs200ResponseBuilder b),
  ]) = _$AdminJobsControllerListJobs200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminJobsControllerListJobs200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminJobsControllerListJobs200Response> get serializer =>
      _$AdminJobsControllerListJobs200ResponseSerializer();
}

class _$AdminJobsControllerListJobs200ResponseSerializer
    implements PrimitiveSerializer<AdminJobsControllerListJobs200Response> {
  @override
  final Iterable<Type> types = const [
    AdminJobsControllerListJobs200Response,
    _$AdminJobsControllerListJobs200Response,
  ];

  @override
  final String wireName = r'AdminJobsControllerListJobs200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminJobsControllerListJobs200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(BuiltList, [FullType(JobDto)]),
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
    AdminJobsControllerListJobs200Response object, {
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
    required AdminJobsControllerListJobs200ResponseBuilder result,
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
              FullType(JobDto),
            ]),
          ) as BuiltList<JobDto>;
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
  AdminJobsControllerListJobs200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminJobsControllerListJobs200ResponseBuilder();
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
