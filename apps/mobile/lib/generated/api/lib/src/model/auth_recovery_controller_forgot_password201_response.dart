//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/success_message_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'auth_recovery_controller_forgot_password201_response.g.dart';

/// AuthRecoveryControllerForgotPassword201Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AuthRecoveryControllerForgotPassword201Response
    implements
        Built<AuthRecoveryControllerForgotPassword201Response,
            AuthRecoveryControllerForgotPassword201ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  SuccessMessageDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AuthRecoveryControllerForgotPassword201Response._();

  factory AuthRecoveryControllerForgotPassword201Response([
    void updates(AuthRecoveryControllerForgotPassword201ResponseBuilder b),
  ]) = _$AuthRecoveryControllerForgotPassword201Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(
    AuthRecoveryControllerForgotPassword201ResponseBuilder b,
  ) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AuthRecoveryControllerForgotPassword201Response>
      get serializer =>
          _$AuthRecoveryControllerForgotPassword201ResponseSerializer();
}

class _$AuthRecoveryControllerForgotPassword201ResponseSerializer
    implements
        PrimitiveSerializer<AuthRecoveryControllerForgotPassword201Response> {
  @override
  final Iterable<Type> types = const [
    AuthRecoveryControllerForgotPassword201Response,
    _$AuthRecoveryControllerForgotPassword201Response,
  ];

  @override
  final String wireName = r'AuthRecoveryControllerForgotPassword201Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AuthRecoveryControllerForgotPassword201Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(SuccessMessageDto),
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
    AuthRecoveryControllerForgotPassword201Response object, {
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
    required AuthRecoveryControllerForgotPassword201ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SuccessMessageDto),
          ) as SuccessMessageDto;
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
  AuthRecoveryControllerForgotPassword201Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AuthRecoveryControllerForgotPassword201ResponseBuilder();
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
