//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:super_template_api/src/model/pagination_meta_dto.dart';
import 'package:super_template_api/src/model/project_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'projects_controller_list200_response.g.dart';

/// ProjectsControllerList200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class ProjectsControllerList200Response
    implements
        Built<ProjectsControllerList200Response,
            ProjectsControllerList200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  BuiltList<ProjectDto> get data;

  @BuiltValueField(wireName: r'meta')
  PaginationMetaDto get meta;

  ProjectsControllerList200Response._();

  factory ProjectsControllerList200Response([
    void updates(ProjectsControllerList200ResponseBuilder b),
  ]) = _$ProjectsControllerList200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ProjectsControllerList200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ProjectsControllerList200Response> get serializer =>
      _$ProjectsControllerList200ResponseSerializer();
}

class _$ProjectsControllerList200ResponseSerializer
    implements PrimitiveSerializer<ProjectsControllerList200Response> {
  @override
  final Iterable<Type> types = const [
    ProjectsControllerList200Response,
    _$ProjectsControllerList200Response,
  ];

  @override
  final String wireName = r'ProjectsControllerList200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ProjectsControllerList200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(BuiltList, [FullType(ProjectDto)]),
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
    ProjectsControllerList200Response object, {
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
    required ProjectsControllerList200ResponseBuilder result,
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
              FullType(ProjectDto),
            ]),
          ) as BuiltList<ProjectDto>;
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
  ProjectsControllerList200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ProjectsControllerList200ResponseBuilder();
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
