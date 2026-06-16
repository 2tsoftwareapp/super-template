//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/invitation_dto.dart';
import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'invitations_controller_create201_response.g.dart';

/// InvitationsControllerCreate201Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class InvitationsControllerCreate201Response
    implements
        Built<InvitationsControllerCreate201Response,
            InvitationsControllerCreate201ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  InvitationDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  InvitationsControllerCreate201Response._();

  factory InvitationsControllerCreate201Response(
          [void updates(InvitationsControllerCreate201ResponseBuilder b)]) =
      _$InvitationsControllerCreate201Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(InvitationsControllerCreate201ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<InvitationsControllerCreate201Response> get serializer =>
      _$InvitationsControllerCreate201ResponseSerializer();
}

class _$InvitationsControllerCreate201ResponseSerializer
    implements PrimitiveSerializer<InvitationsControllerCreate201Response> {
  @override
  final Iterable<Type> types = const [
    InvitationsControllerCreate201Response,
    _$InvitationsControllerCreate201Response
  ];

  @override
  final String wireName = r'InvitationsControllerCreate201Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    InvitationsControllerCreate201Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(InvitationDto),
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
    InvitationsControllerCreate201Response object, {
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
    required InvitationsControllerCreate201ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(InvitationDto),
          ) as InvitationDto;
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
  InvitationsControllerCreate201Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = InvitationsControllerCreate201ResponseBuilder();
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
