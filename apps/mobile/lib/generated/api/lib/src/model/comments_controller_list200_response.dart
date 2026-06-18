//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:super_template_api/src/model/pagination_meta_dto.dart';
import 'package:super_template_api/src/model/comment_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'comments_controller_list200_response.g.dart';

/// CommentsControllerList200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class CommentsControllerList200Response
    implements
        Built<CommentsControllerList200Response,
            CommentsControllerList200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  BuiltList<CommentDto> get data;

  @BuiltValueField(wireName: r'meta')
  PaginationMetaDto get meta;

  CommentsControllerList200Response._();

  factory CommentsControllerList200Response([
    void updates(CommentsControllerList200ResponseBuilder b),
  ]) = _$CommentsControllerList200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CommentsControllerList200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CommentsControllerList200Response> get serializer =>
      _$CommentsControllerList200ResponseSerializer();
}

class _$CommentsControllerList200ResponseSerializer
    implements PrimitiveSerializer<CommentsControllerList200Response> {
  @override
  final Iterable<Type> types = const [
    CommentsControllerList200Response,
    _$CommentsControllerList200Response,
  ];

  @override
  final String wireName = r'CommentsControllerList200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CommentsControllerList200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(BuiltList, [FullType(CommentDto)]),
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
    CommentsControllerList200Response object, {
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
    required CommentsControllerList200ResponseBuilder result,
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
              FullType(CommentDto),
            ]),
          ) as BuiltList<CommentDto>;
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
  CommentsControllerList200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CommentsControllerList200ResponseBuilder();
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
