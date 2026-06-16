//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/auth_me_dto.dart';
import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'auth_controller_get_me200_response.g.dart';

/// AuthControllerGetMe200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AuthControllerGetMe200Response
    implements
        Built<AuthControllerGetMe200Response,
            AuthControllerGetMe200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  AuthMeDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AuthControllerGetMe200Response._();

  factory AuthControllerGetMe200Response(
          [void updates(AuthControllerGetMe200ResponseBuilder b)]) =
      _$AuthControllerGetMe200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AuthControllerGetMe200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AuthControllerGetMe200Response> get serializer =>
      _$AuthControllerGetMe200ResponseSerializer();
}

class _$AuthControllerGetMe200ResponseSerializer
    implements PrimitiveSerializer<AuthControllerGetMe200Response> {
  @override
  final Iterable<Type> types = const [
    AuthControllerGetMe200Response,
    _$AuthControllerGetMe200Response
  ];

  @override
  final String wireName = r'AuthControllerGetMe200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AuthControllerGetMe200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(AuthMeDto),
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
    AuthControllerGetMe200Response object, {
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
    required AuthControllerGetMe200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(AuthMeDto),
          ) as AuthMeDto;
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
  AuthControllerGetMe200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AuthControllerGetMe200ResponseBuilder();
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
