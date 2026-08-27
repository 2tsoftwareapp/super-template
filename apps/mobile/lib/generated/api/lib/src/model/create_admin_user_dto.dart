//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_admin_user_dto.g.dart';

/// CreateAdminUserDto
///
/// Properties:
/// * [avatarUrl]
/// * [displayName]
/// * [email]
/// * [organizationId]
/// * [password]
/// * [roleId]
/// * [status]
@BuiltValue()
abstract class CreateAdminUserDto
    implements Built<CreateAdminUserDto, CreateAdminUserDtoBuilder> {
  @BuiltValueField(wireName: r'avatarUrl')
  JsonObject? get avatarUrl;

  @BuiltValueField(wireName: r'displayName')
  String get displayName;

  @BuiltValueField(wireName: r'email')
  String get email;

  @BuiltValueField(wireName: r'organizationId')
  String? get organizationId;

  @BuiltValueField(wireName: r'password')
  String get password;

  @BuiltValueField(wireName: r'roleId')
  String? get roleId;

  @BuiltValueField(wireName: r'status')
  CreateAdminUserDtoStatusEnum? get status;
  // enum statusEnum {  PENDING,  ACTIVE,  BLOCKED,  };

  CreateAdminUserDto._();

  factory CreateAdminUserDto([void updates(CreateAdminUserDtoBuilder b)]) =
      _$CreateAdminUserDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateAdminUserDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateAdminUserDto> get serializer =>
      _$CreateAdminUserDtoSerializer();
}

class _$CreateAdminUserDtoSerializer
    implements PrimitiveSerializer<CreateAdminUserDto> {
  @override
  final Iterable<Type> types = const [CreateAdminUserDto, _$CreateAdminUserDto];

  @override
  final String wireName = r'CreateAdminUserDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateAdminUserDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.avatarUrl != null) {
      yield r'avatarUrl';
      yield serializers.serialize(
        object.avatarUrl,
        specifiedType: const FullType(JsonObject),
      );
    }
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
    if (object.organizationId != null) {
      yield r'organizationId';
      yield serializers.serialize(
        object.organizationId,
        specifiedType: const FullType(String),
      );
    }
    yield r'password';
    yield serializers.serialize(
      object.password,
      specifiedType: const FullType(String),
    );
    if (object.roleId != null) {
      yield r'roleId';
      yield serializers.serialize(
        object.roleId,
        specifiedType: const FullType(String),
      );
    }
    if (object.status != null) {
      yield r'status';
      yield serializers.serialize(
        object.status,
        specifiedType: const FullType(CreateAdminUserDtoStatusEnum),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateAdminUserDto object, {
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
    required CreateAdminUserDtoBuilder result,
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
        case r'organizationId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.organizationId = valueDes;
          break;
        case r'password':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.password = valueDes;
          break;
        case r'roleId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.roleId = valueDes;
          break;
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CreateAdminUserDtoStatusEnum),
          ) as CreateAdminUserDtoStatusEnum;
          result.status = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateAdminUserDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateAdminUserDtoBuilder();
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

class CreateAdminUserDtoStatusEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'PENDING')
  static const CreateAdminUserDtoStatusEnum PENDING =
      _$createAdminUserDtoStatusEnum_PENDING;
  @BuiltValueEnumConst(wireName: r'ACTIVE')
  static const CreateAdminUserDtoStatusEnum ACTIVE =
      _$createAdminUserDtoStatusEnum_ACTIVE;
  @BuiltValueEnumConst(wireName: r'BLOCKED')
  static const CreateAdminUserDtoStatusEnum BLOCKED =
      _$createAdminUserDtoStatusEnum_BLOCKED;

  static Serializer<CreateAdminUserDtoStatusEnum> get serializer =>
      _$createAdminUserDtoStatusEnumSerializer;

  const CreateAdminUserDtoStatusEnum._(String name) : super(name);

  static BuiltSet<CreateAdminUserDtoStatusEnum> get values =>
      _$createAdminUserDtoStatusEnumValues;
  static CreateAdminUserDtoStatusEnum valueOf(String name) =>
      _$createAdminUserDtoStatusEnumValueOf(name);
}
