//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:super_template_api/src/model/activity_dto.dart';
import 'package:super_template_api/src/model/pagination_meta_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'activities_controller_list200_response.g.dart';

/// ActivitiesControllerList200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class ActivitiesControllerList200Response
    implements
        Built<ActivitiesControllerList200Response,
            ActivitiesControllerList200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  BuiltList<ActivityDto> get data;

  @BuiltValueField(wireName: r'meta')
  PaginationMetaDto get meta;

  ActivitiesControllerList200Response._();

  factory ActivitiesControllerList200Response([
    void updates(ActivitiesControllerList200ResponseBuilder b),
  ]) = _$ActivitiesControllerList200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ActivitiesControllerList200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ActivitiesControllerList200Response> get serializer =>
      _$ActivitiesControllerList200ResponseSerializer();
}

class _$ActivitiesControllerList200ResponseSerializer
    implements PrimitiveSerializer<ActivitiesControllerList200Response> {
  @override
  final Iterable<Type> types = const [
    ActivitiesControllerList200Response,
    _$ActivitiesControllerList200Response,
  ];

  @override
  final String wireName = r'ActivitiesControllerList200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ActivitiesControllerList200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(BuiltList, [FullType(ActivityDto)]),
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
    ActivitiesControllerList200Response object, {
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
    required ActivitiesControllerList200ResponseBuilder result,
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
              FullType(ActivityDto),
            ]),
          ) as BuiltList<ActivityDto>;
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
  ActivitiesControllerList200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ActivitiesControllerList200ResponseBuilder();
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
