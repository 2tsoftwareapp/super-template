//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/project_attachment_dto.dart';
import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'projects_controller_list_attachments200_response.g.dart';

/// ProjectsControllerListAttachments200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class ProjectsControllerListAttachments200Response
    implements
        Built<ProjectsControllerListAttachments200Response,
            ProjectsControllerListAttachments200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  BuiltList<ProjectAttachmentDto> get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  ProjectsControllerListAttachments200Response._();

  factory ProjectsControllerListAttachments200Response([
    void updates(ProjectsControllerListAttachments200ResponseBuilder b),
  ]) = _$ProjectsControllerListAttachments200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(
    ProjectsControllerListAttachments200ResponseBuilder b,
  ) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ProjectsControllerListAttachments200Response>
      get serializer =>
          _$ProjectsControllerListAttachments200ResponseSerializer();
}

class _$ProjectsControllerListAttachments200ResponseSerializer
    implements
        PrimitiveSerializer<ProjectsControllerListAttachments200Response> {
  @override
  final Iterable<Type> types = const [
    ProjectsControllerListAttachments200Response,
    _$ProjectsControllerListAttachments200Response,
  ];

  @override
  final String wireName = r'ProjectsControllerListAttachments200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ProjectsControllerListAttachments200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(BuiltList, [
        FullType(ProjectAttachmentDto),
      ]),
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
    ProjectsControllerListAttachments200Response object, {
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
    required ProjectsControllerListAttachments200ResponseBuilder result,
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
              FullType(ProjectAttachmentDto),
            ]),
          ) as BuiltList<ProjectAttachmentDto>;
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
  ProjectsControllerListAttachments200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ProjectsControllerListAttachments200ResponseBuilder();
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
