//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/auth_response_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'auth_login_controller_verify_mfa_challenge201_response.g.dart';

/// AuthLoginControllerVerifyMfaChallenge201Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AuthLoginControllerVerifyMfaChallenge201Response
    implements
        Built<AuthLoginControllerVerifyMfaChallenge201Response,
            AuthLoginControllerVerifyMfaChallenge201ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  AuthResponseDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AuthLoginControllerVerifyMfaChallenge201Response._();

  factory AuthLoginControllerVerifyMfaChallenge201Response([
    void updates(AuthLoginControllerVerifyMfaChallenge201ResponseBuilder b),
  ]) = _$AuthLoginControllerVerifyMfaChallenge201Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(
    AuthLoginControllerVerifyMfaChallenge201ResponseBuilder b,
  ) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AuthLoginControllerVerifyMfaChallenge201Response>
      get serializer =>
          _$AuthLoginControllerVerifyMfaChallenge201ResponseSerializer();
}

class _$AuthLoginControllerVerifyMfaChallenge201ResponseSerializer
    implements
        PrimitiveSerializer<AuthLoginControllerVerifyMfaChallenge201Response> {
  @override
  final Iterable<Type> types = const [
    AuthLoginControllerVerifyMfaChallenge201Response,
    _$AuthLoginControllerVerifyMfaChallenge201Response,
  ];

  @override
  final String wireName = r'AuthLoginControllerVerifyMfaChallenge201Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AuthLoginControllerVerifyMfaChallenge201Response object, {
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
    AuthLoginControllerVerifyMfaChallenge201Response object, {
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
    required AuthLoginControllerVerifyMfaChallenge201ResponseBuilder result,
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
  AuthLoginControllerVerifyMfaChallenge201Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AuthLoginControllerVerifyMfaChallenge201ResponseBuilder();
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
