//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/success_message_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'auth_registration_controller_register201_response.g.dart';

/// AuthRegistrationControllerRegister201Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AuthRegistrationControllerRegister201Response
    implements
        Built<AuthRegistrationControllerRegister201Response,
            AuthRegistrationControllerRegister201ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  SuccessMessageDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AuthRegistrationControllerRegister201Response._();

  factory AuthRegistrationControllerRegister201Response([
    void updates(AuthRegistrationControllerRegister201ResponseBuilder b),
  ]) = _$AuthRegistrationControllerRegister201Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(
    AuthRegistrationControllerRegister201ResponseBuilder b,
  ) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AuthRegistrationControllerRegister201Response>
      get serializer =>
          _$AuthRegistrationControllerRegister201ResponseSerializer();
}

class _$AuthRegistrationControllerRegister201ResponseSerializer
    implements
        PrimitiveSerializer<AuthRegistrationControllerRegister201Response> {
  @override
  final Iterable<Type> types = const [
    AuthRegistrationControllerRegister201Response,
    _$AuthRegistrationControllerRegister201Response,
  ];

  @override
  final String wireName = r'AuthRegistrationControllerRegister201Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AuthRegistrationControllerRegister201Response object, {
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
    AuthRegistrationControllerRegister201Response object, {
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
    required AuthRegistrationControllerRegister201ResponseBuilder result,
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
  AuthRegistrationControllerRegister201Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AuthRegistrationControllerRegister201ResponseBuilder();
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
