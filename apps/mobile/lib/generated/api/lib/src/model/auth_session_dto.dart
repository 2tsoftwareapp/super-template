//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'auth_session_dto.g.dart';

/// AuthSessionDto
///
/// Properties:
/// * [id]
/// * [userId]
/// * [expiresAt]
/// * [revokedAt]
/// * [lastUsedAt]
/// * [ipAddress]
/// * [userAgent]
/// * [createdAt]
/// * [updatedAt]
/// * [current]
@BuiltValue()
abstract class AuthSessionDto
    implements Built<AuthSessionDto, AuthSessionDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'userId')
  String get userId;

  @BuiltValueField(wireName: r'expiresAt')
  String get expiresAt;

  @BuiltValueField(wireName: r'revokedAt')
  JsonObject? get revokedAt;

  @BuiltValueField(wireName: r'lastUsedAt')
  JsonObject? get lastUsedAt;

  @BuiltValueField(wireName: r'ipAddress')
  JsonObject? get ipAddress;

  @BuiltValueField(wireName: r'userAgent')
  JsonObject? get userAgent;

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  @BuiltValueField(wireName: r'updatedAt')
  String get updatedAt;

  @BuiltValueField(wireName: r'current')
  bool get current;

  AuthSessionDto._();

  factory AuthSessionDto([void updates(AuthSessionDtoBuilder b)]) =
      _$AuthSessionDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AuthSessionDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AuthSessionDto> get serializer =>
      _$AuthSessionDtoSerializer();
}

class _$AuthSessionDtoSerializer
    implements PrimitiveSerializer<AuthSessionDto> {
  @override
  final Iterable<Type> types = const [AuthSessionDto, _$AuthSessionDto];

  @override
  final String wireName = r'AuthSessionDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AuthSessionDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'userId';
    yield serializers.serialize(
      object.userId,
      specifiedType: const FullType(String),
    );
    yield r'expiresAt';
    yield serializers.serialize(
      object.expiresAt,
      specifiedType: const FullType(String),
    );
    if (object.revokedAt != null) {
      yield r'revokedAt';
      yield serializers.serialize(
        object.revokedAt,
        specifiedType: const FullType(JsonObject),
      );
    }
    if (object.lastUsedAt != null) {
      yield r'lastUsedAt';
      yield serializers.serialize(
        object.lastUsedAt,
        specifiedType: const FullType(JsonObject),
      );
    }
    if (object.ipAddress != null) {
      yield r'ipAddress';
      yield serializers.serialize(
        object.ipAddress,
        specifiedType: const FullType(JsonObject),
      );
    }
    if (object.userAgent != null) {
      yield r'userAgent';
      yield serializers.serialize(
        object.userAgent,
        specifiedType: const FullType(JsonObject),
      );
    }
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
    );
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(String),
    );
    yield r'current';
    yield serializers.serialize(
      object.current,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AuthSessionDto object, {
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
    required AuthSessionDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'userId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.userId = valueDes;
          break;
        case r'expiresAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.expiresAt = valueDes;
          break;
        case r'revokedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.revokedAt = valueDes;
          break;
        case r'lastUsedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.lastUsedAt = valueDes;
          break;
        case r'ipAddress':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.ipAddress = valueDes;
          break;
        case r'userAgent':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.userAgent = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdAt = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.updatedAt = valueDes;
          break;
        case r'current':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.current = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AuthSessionDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AuthSessionDtoBuilder();
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
