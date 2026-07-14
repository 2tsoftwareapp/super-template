//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/login_response_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'auth_login_controller_login201_response.g.dart';

/// AuthLoginControllerLogin201Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AuthLoginControllerLogin201Response
    implements
        Built<AuthLoginControllerLogin201Response,
            AuthLoginControllerLogin201ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  LoginResponseDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AuthLoginControllerLogin201Response._();

  factory AuthLoginControllerLogin201Response([
    void updates(AuthLoginControllerLogin201ResponseBuilder b),
  ]) = _$AuthLoginControllerLogin201Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AuthLoginControllerLogin201ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AuthLoginControllerLogin201Response> get serializer =>
      _$AuthLoginControllerLogin201ResponseSerializer();
}

class _$AuthLoginControllerLogin201ResponseSerializer
    implements PrimitiveSerializer<AuthLoginControllerLogin201Response> {
  @override
  final Iterable<Type> types = const [
    AuthLoginControllerLogin201Response,
    _$AuthLoginControllerLogin201Response,
  ];

  @override
  final String wireName = r'AuthLoginControllerLogin201Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AuthLoginControllerLogin201Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(LoginResponseDto),
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
    AuthLoginControllerLogin201Response object, {
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
    required AuthLoginControllerLogin201ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(LoginResponseDto),
          ) as LoginResponseDto;
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
  AuthLoginControllerLogin201Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AuthLoginControllerLogin201ResponseBuilder();
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
