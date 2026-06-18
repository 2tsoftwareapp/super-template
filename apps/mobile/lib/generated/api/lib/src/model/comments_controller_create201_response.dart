//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/comment_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'comments_controller_create201_response.g.dart';

/// CommentsControllerCreate201Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class CommentsControllerCreate201Response
    implements
        Built<CommentsControllerCreate201Response,
            CommentsControllerCreate201ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  CommentDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  CommentsControllerCreate201Response._();

  factory CommentsControllerCreate201Response([
    void updates(CommentsControllerCreate201ResponseBuilder b),
  ]) = _$CommentsControllerCreate201Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CommentsControllerCreate201ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CommentsControllerCreate201Response> get serializer =>
      _$CommentsControllerCreate201ResponseSerializer();
}

class _$CommentsControllerCreate201ResponseSerializer
    implements PrimitiveSerializer<CommentsControllerCreate201Response> {
  @override
  final Iterable<Type> types = const [
    CommentsControllerCreate201Response,
    _$CommentsControllerCreate201Response,
  ];

  @override
  final String wireName = r'CommentsControllerCreate201Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CommentsControllerCreate201Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(CommentDto),
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
    CommentsControllerCreate201Response object, {
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
    required CommentsControllerCreate201ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CommentDto),
          ) as CommentDto;
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
  CommentsControllerCreate201Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CommentsControllerCreate201ResponseBuilder();
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
