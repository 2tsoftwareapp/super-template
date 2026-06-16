//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/project_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'projects_controller_create201_response.g.dart';

/// ProjectsControllerCreate201Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class ProjectsControllerCreate201Response
    implements
        Built<ProjectsControllerCreate201Response,
            ProjectsControllerCreate201ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  ProjectDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  ProjectsControllerCreate201Response._();

  factory ProjectsControllerCreate201Response(
          [void updates(ProjectsControllerCreate201ResponseBuilder b)]) =
      _$ProjectsControllerCreate201Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ProjectsControllerCreate201ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ProjectsControllerCreate201Response> get serializer =>
      _$ProjectsControllerCreate201ResponseSerializer();
}

class _$ProjectsControllerCreate201ResponseSerializer
    implements PrimitiveSerializer<ProjectsControllerCreate201Response> {
  @override
  final Iterable<Type> types = const [
    ProjectsControllerCreate201Response,
    _$ProjectsControllerCreate201Response
  ];

  @override
  final String wireName = r'ProjectsControllerCreate201Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ProjectsControllerCreate201Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(ProjectDto),
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
    ProjectsControllerCreate201Response object, {
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
    required ProjectsControllerCreate201ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ProjectDto),
          ) as ProjectDto;
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
  ProjectsControllerCreate201Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ProjectsControllerCreate201ResponseBuilder();
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
