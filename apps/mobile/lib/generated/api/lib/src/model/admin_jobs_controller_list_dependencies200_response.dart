//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/job_dependency_dto.dart';
import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_jobs_controller_list_dependencies200_response.g.dart';

/// AdminJobsControllerListDependencies200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AdminJobsControllerListDependencies200Response
    implements
        Built<AdminJobsControllerListDependencies200Response,
            AdminJobsControllerListDependencies200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  BuiltList<JobDependencyDto> get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AdminJobsControllerListDependencies200Response._();

  factory AdminJobsControllerListDependencies200Response([
    void updates(AdminJobsControllerListDependencies200ResponseBuilder b),
  ]) = _$AdminJobsControllerListDependencies200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(
    AdminJobsControllerListDependencies200ResponseBuilder b,
  ) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminJobsControllerListDependencies200Response>
      get serializer =>
          _$AdminJobsControllerListDependencies200ResponseSerializer();
}

class _$AdminJobsControllerListDependencies200ResponseSerializer
    implements
        PrimitiveSerializer<AdminJobsControllerListDependencies200Response> {
  @override
  final Iterable<Type> types = const [
    AdminJobsControllerListDependencies200Response,
    _$AdminJobsControllerListDependencies200Response,
  ];

  @override
  final String wireName = r'AdminJobsControllerListDependencies200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminJobsControllerListDependencies200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(BuiltList, [FullType(JobDependencyDto)]),
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
    AdminJobsControllerListDependencies200Response object, {
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
    required AdminJobsControllerListDependencies200ResponseBuilder result,
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
              FullType(JobDependencyDto),
            ]),
          ) as BuiltList<JobDependencyDto>;
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
  AdminJobsControllerListDependencies200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminJobsControllerListDependencies200ResponseBuilder();
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
