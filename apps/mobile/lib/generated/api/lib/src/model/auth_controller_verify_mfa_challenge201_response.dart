//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/auth_response_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'auth_controller_verify_mfa_challenge201_response.g.dart';

/// AuthControllerVerifyMfaChallenge201Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AuthControllerVerifyMfaChallenge201Response
    implements
        Built<AuthControllerVerifyMfaChallenge201Response,
            AuthControllerVerifyMfaChallenge201ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  AuthResponseDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AuthControllerVerifyMfaChallenge201Response._();

  factory AuthControllerVerifyMfaChallenge201Response([
    void updates(AuthControllerVerifyMfaChallenge201ResponseBuilder b),
  ]) = _$AuthControllerVerifyMfaChallenge201Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AuthControllerVerifyMfaChallenge201ResponseBuilder b) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AuthControllerVerifyMfaChallenge201Response>
      get serializer =>
          _$AuthControllerVerifyMfaChallenge201ResponseSerializer();
}

class _$AuthControllerVerifyMfaChallenge201ResponseSerializer
    implements
        PrimitiveSerializer<AuthControllerVerifyMfaChallenge201Response> {
  @override
  final Iterable<Type> types = const [
    AuthControllerVerifyMfaChallenge201Response,
    _$AuthControllerVerifyMfaChallenge201Response,
  ];

  @override
  final String wireName = r'AuthControllerVerifyMfaChallenge201Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AuthControllerVerifyMfaChallenge201Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(AuthResponseDto),
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
    AuthControllerVerifyMfaChallenge201Response object, {
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
    required AuthControllerVerifyMfaChallenge201ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(AuthResponseDto),
          ) as AuthResponseDto;
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
  AuthControllerVerifyMfaChallenge201Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AuthControllerVerifyMfaChallenge201ResponseBuilder();
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
