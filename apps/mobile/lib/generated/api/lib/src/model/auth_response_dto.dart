//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:super_template_api/src/model/user_dto.dart';
import 'package:super_template_api/src/model/auth_session_dto.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'auth_response_dto.g.dart';

/// AuthResponseDto
///
/// Properties:
/// * [accessToken]
/// * [refreshToken]
/// * [user]
/// * [permissions]
/// * [session]
/// * [organizationId]
@BuiltValue()
abstract class AuthResponseDto
    implements Built<AuthResponseDto, AuthResponseDtoBuilder> {
  @BuiltValueField(wireName: r'accessToken')
  String get accessToken;

  @BuiltValueField(wireName: r'refreshToken')
  String get refreshToken;

  @BuiltValueField(wireName: r'user')
  UserDto get user;

  @BuiltValueField(wireName: r'permissions')
  BuiltList<String> get permissions;

  @BuiltValueField(wireName: r'session')
  AuthSessionDto get session;

  @BuiltValueField(wireName: r'organizationId')
  JsonObject? get organizationId;

  AuthResponseDto._();

  factory AuthResponseDto([void updates(AuthResponseDtoBuilder b)]) =
      _$AuthResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AuthResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AuthResponseDto> get serializer =>
      _$AuthResponseDtoSerializer();
}

class _$AuthResponseDtoSerializer
    implements PrimitiveSerializer<AuthResponseDto> {
  @override
  final Iterable<Type> types = const [AuthResponseDto, _$AuthResponseDto];

  @override
  final String wireName = r'AuthResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AuthResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'accessToken';
    yield serializers.serialize(
      object.accessToken,
      specifiedType: const FullType(String),
    );
    yield r'refreshToken';
    yield serializers.serialize(
      object.refreshToken,
      specifiedType: const FullType(String),
    );
    yield r'user';
    yield serializers.serialize(
      object.user,
      specifiedType: const FullType(UserDto),
    );
    yield r'permissions';
    yield serializers.serialize(
      object.permissions,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    yield r'session';
    yield serializers.serialize(
      object.session,
      specifiedType: const FullType(AuthSessionDto),
    );
    yield r'organizationId';
    yield object.organizationId == null
        ? null
        : serializers.serialize(
            object.organizationId,
            specifiedType: const FullType.nullable(JsonObject),
          );
  }

  @override
  Object serialize(
    Serializers serializers,
    AuthResponseDto object, {
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
    required AuthResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'accessToken':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.accessToken = valueDes;
          break;
        case r'refreshToken':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.refreshToken = valueDes;
          break;
        case r'user':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UserDto),
          ) as UserDto;
          result.user.replace(valueDes);
          break;
        case r'permissions':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [
              FullType(String),
            ]),
          ) as BuiltList<String>;
          result.permissions.replace(valueDes);
          break;
        case r'session':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(AuthSessionDto),
          ) as AuthSessionDto;
          result.session.replace(valueDes);
          break;
        case r'organizationId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(JsonObject),
          ) as JsonObject?;
          if (valueDes == null) continue;
          result.organizationId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AuthResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AuthResponseDtoBuilder();
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
