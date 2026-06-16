//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/success_message_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'auth_controller_register201_response.g.dart';

/// AuthControllerRegister201Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AuthControllerRegister201Response
    implements
        Built<AuthControllerRegister201Response,
            AuthControllerRegister201ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  SuccessMessageDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AuthControllerRegister201Response._();

  factory AuthControllerRegister201Response(
          [void updates(AuthControllerRegister201ResponseBuilder b)]) =
      _$AuthControllerRegister201Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AuthControllerRegister201ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AuthControllerRegister201Response> get serializer =>
      _$AuthControllerRegister201ResponseSerializer();
}

class _$AuthControllerRegister201ResponseSerializer
    implements PrimitiveSerializer<AuthControllerRegister201Response> {
  @override
  final Iterable<Type> types = const [
    AuthControllerRegister201Response,
    _$AuthControllerRegister201Response
  ];

  @override
  final String wireName = r'AuthControllerRegister201Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AuthControllerRegister201Response object, {
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
    AuthControllerRegister201Response object, {
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
    required AuthControllerRegister201ResponseBuilder result,
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
  AuthControllerRegister201Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AuthControllerRegister201ResponseBuilder();
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
