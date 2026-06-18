//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:super_template_api/src/model/user_dto.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'auth_me_dto.g.dart';

/// AuthMeDto
///
/// Properties:
/// * [user]
/// * [permissions]
/// * [sessionId]
/// * [organizationId]
@BuiltValue()
abstract class AuthMeDto implements Built<AuthMeDto, AuthMeDtoBuilder> {
  @BuiltValueField(wireName: r'user')
  UserDto get user;

  @BuiltValueField(wireName: r'permissions')
  BuiltList<String> get permissions;

  @BuiltValueField(wireName: r'sessionId')
  String get sessionId;

  @BuiltValueField(wireName: r'organizationId')
  JsonObject? get organizationId;

  AuthMeDto._();

  factory AuthMeDto([void updates(AuthMeDtoBuilder b)]) = _$AuthMeDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AuthMeDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AuthMeDto> get serializer => _$AuthMeDtoSerializer();
}

class _$AuthMeDtoSerializer implements PrimitiveSerializer<AuthMeDto> {
  @override
  final Iterable<Type> types = const [AuthMeDto, _$AuthMeDto];

  @override
  final String wireName = r'AuthMeDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AuthMeDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
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
    yield r'sessionId';
    yield serializers.serialize(
      object.sessionId,
      specifiedType: const FullType(String),
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
    AuthMeDto object, {
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
    required AuthMeDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
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
        case r'sessionId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.sessionId = valueDes;
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
  AuthMeDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AuthMeDtoBuilder();
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
