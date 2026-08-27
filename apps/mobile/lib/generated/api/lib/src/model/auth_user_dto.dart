//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'auth_user_dto.g.dart';

/// AuthUserDto
///
/// Properties:
/// * [avatarUrl]
/// * [createdAt]
/// * [displayName]
/// * [email]
/// * [emailVerifiedAt]
/// * [id]
/// * [roles]
/// * [status]
/// * [updatedAt]
@BuiltValue()
abstract class AuthUserDto implements Built<AuthUserDto, AuthUserDtoBuilder> {
  @BuiltValueField(wireName: r'avatarUrl')
  JsonObject? get avatarUrl;

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  @BuiltValueField(wireName: r'displayName')
  String get displayName;

  @BuiltValueField(wireName: r'email')
  String get email;

  @BuiltValueField(wireName: r'emailVerifiedAt')
  String? get emailVerifiedAt;

  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'roles')
  BuiltList<String> get roles;

  @BuiltValueField(wireName: r'status')
  AuthUserDtoStatusEnum get status;
  // enum statusEnum {  PENDING,  ACTIVE,  BLOCKED,  };

  @BuiltValueField(wireName: r'updatedAt')
  String get updatedAt;

  AuthUserDto._();

  factory AuthUserDto([void updates(AuthUserDtoBuilder b)]) = _$AuthUserDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AuthUserDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AuthUserDto> get serializer => _$AuthUserDtoSerializer();
}

class _$AuthUserDtoSerializer implements PrimitiveSerializer<AuthUserDto> {
  @override
  final Iterable<Type> types = const [AuthUserDto, _$AuthUserDto];

  @override
  final String wireName = r'AuthUserDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AuthUserDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.avatarUrl != null) {
      yield r'avatarUrl';
      yield serializers.serialize(
        object.avatarUrl,
        specifiedType: const FullType(JsonObject),
      );
    }
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
    );
    yield r'displayName';
    yield serializers.serialize(
      object.displayName,
      specifiedType: const FullType(String),
    );
    yield r'email';
    yield serializers.serialize(
      object.email,
      specifiedType: const FullType(String),
    );
    yield r'emailVerifiedAt';
    yield object.emailVerifiedAt == null
        ? null
        : serializers.serialize(
            object.emailVerifiedAt,
            specifiedType: const FullType.nullable(String),
          );
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'roles';
    yield serializers.serialize(
      object.roles,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(AuthUserDtoStatusEnum),
    );
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AuthUserDto object, {
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
    required AuthUserDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'avatarUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.avatarUrl = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdAt = valueDes;
          break;
        case r'displayName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.displayName = valueDes;
          break;
        case r'email':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.email = valueDes;
          break;
        case r'emailVerifiedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.emailVerifiedAt = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'roles':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [
              FullType(String),
            ]),
          ) as BuiltList<String>;
          result.roles.replace(valueDes);
          break;
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(AuthUserDtoStatusEnum),
          ) as AuthUserDtoStatusEnum;
          result.status = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.updatedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AuthUserDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AuthUserDtoBuilder();
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

class AuthUserDtoStatusEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'PENDING')
  static const AuthUserDtoStatusEnum PENDING = _$authUserDtoStatusEnum_PENDING;
  @BuiltValueEnumConst(wireName: r'ACTIVE')
  static const AuthUserDtoStatusEnum ACTIVE = _$authUserDtoStatusEnum_ACTIVE;
  @BuiltValueEnumConst(wireName: r'BLOCKED')
  static const AuthUserDtoStatusEnum BLOCKED = _$authUserDtoStatusEnum_BLOCKED;

  static Serializer<AuthUserDtoStatusEnum> get serializer =>
      _$authUserDtoStatusEnumSerializer;

  const AuthUserDtoStatusEnum._(String name) : super(name);

  static BuiltSet<AuthUserDtoStatusEnum> get values =>
      _$authUserDtoStatusEnumValues;
  static AuthUserDtoStatusEnum valueOf(String name) =>
      _$authUserDtoStatusEnumValueOf(name);
}
