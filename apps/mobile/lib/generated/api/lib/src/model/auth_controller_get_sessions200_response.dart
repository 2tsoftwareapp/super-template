//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:super_template_api/src/model/auth_session_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'auth_controller_get_sessions200_response.g.dart';

/// AuthControllerGetSessions200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AuthControllerGetSessions200Response
    implements
        Built<AuthControllerGetSessions200Response,
            AuthControllerGetSessions200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  BuiltList<AuthSessionDto> get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AuthControllerGetSessions200Response._();

  factory AuthControllerGetSessions200Response(
          [void updates(AuthControllerGetSessions200ResponseBuilder b)]) =
      _$AuthControllerGetSessions200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AuthControllerGetSessions200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AuthControllerGetSessions200Response> get serializer =>
      _$AuthControllerGetSessions200ResponseSerializer();
}

class _$AuthControllerGetSessions200ResponseSerializer
    implements PrimitiveSerializer<AuthControllerGetSessions200Response> {
  @override
  final Iterable<Type> types = const [
    AuthControllerGetSessions200Response,
    _$AuthControllerGetSessions200Response
  ];

  @override
  final String wireName = r'AuthControllerGetSessions200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AuthControllerGetSessions200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(BuiltList, [FullType(AuthSessionDto)]),
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
    AuthControllerGetSessions200Response object, {
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
    required AuthControllerGetSessions200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType:
                const FullType(BuiltList, [FullType(AuthSessionDto)]),
          ) as BuiltList<AuthSessionDto>;
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
  AuthControllerGetSessions200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AuthControllerGetSessions200ResponseBuilder();
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
