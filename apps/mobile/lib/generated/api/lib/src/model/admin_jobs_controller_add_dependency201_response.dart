//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/job_dependency_dto.dart';
import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_jobs_controller_add_dependency201_response.g.dart';

/// AdminJobsControllerAddDependency201Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AdminJobsControllerAddDependency201Response
    implements
        Built<AdminJobsControllerAddDependency201Response,
            AdminJobsControllerAddDependency201ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  JobDependencyDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AdminJobsControllerAddDependency201Response._();

  factory AdminJobsControllerAddDependency201Response([
    void updates(AdminJobsControllerAddDependency201ResponseBuilder b),
  ]) = _$AdminJobsControllerAddDependency201Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminJobsControllerAddDependency201ResponseBuilder b) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminJobsControllerAddDependency201Response>
      get serializer =>
          _$AdminJobsControllerAddDependency201ResponseSerializer();
}

class _$AdminJobsControllerAddDependency201ResponseSerializer
    implements
        PrimitiveSerializer<AdminJobsControllerAddDependency201Response> {
  @override
  final Iterable<Type> types = const [
    AdminJobsControllerAddDependency201Response,
    _$AdminJobsControllerAddDependency201Response,
  ];

  @override
  final String wireName = r'AdminJobsControllerAddDependency201Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminJobsControllerAddDependency201Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(JobDependencyDto),
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
    AdminJobsControllerAddDependency201Response object, {
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
    required AdminJobsControllerAddDependency201ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobDependencyDto),
          ) as JobDependencyDto;
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
  AdminJobsControllerAddDependency201Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminJobsControllerAddDependency201ResponseBuilder();
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
