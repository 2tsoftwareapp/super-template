//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/invitation_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:super_template_api/src/model/pagination_meta_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'invitations_controller_list200_response.g.dart';

/// InvitationsControllerList200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class InvitationsControllerList200Response
    implements
        Built<InvitationsControllerList200Response,
            InvitationsControllerList200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  BuiltList<InvitationDto> get data;

  @BuiltValueField(wireName: r'meta')
  PaginationMetaDto get meta;

  InvitationsControllerList200Response._();

  factory InvitationsControllerList200Response(
          [void updates(InvitationsControllerList200ResponseBuilder b)]) =
      _$InvitationsControllerList200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(InvitationsControllerList200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<InvitationsControllerList200Response> get serializer =>
      _$InvitationsControllerList200ResponseSerializer();
}

class _$InvitationsControllerList200ResponseSerializer
    implements PrimitiveSerializer<InvitationsControllerList200Response> {
  @override
  final Iterable<Type> types = const [
    InvitationsControllerList200Response,
    _$InvitationsControllerList200Response
  ];

  @override
  final String wireName = r'InvitationsControllerList200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    InvitationsControllerList200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(BuiltList, [FullType(InvitationDto)]),
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
    InvitationsControllerList200Response object, {
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
    required InvitationsControllerList200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(InvitationDto)]),
          ) as BuiltList<InvitationDto>;
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
  InvitationsControllerList200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = InvitationsControllerList200ResponseBuilder();
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
