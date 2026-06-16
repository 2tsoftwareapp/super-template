//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'invitation_dto.g.dart';

/// InvitationDto
///
/// Properties:
/// * [id]
/// * [email]
/// * [entityType]
/// * [entityId]
/// * [role]
/// * [invitedById]
/// * [status]
/// * [expiresAt]
/// * [acceptedAt]
/// * [acceptedById]
/// * [createdAt]
/// * [updatedAt]
@BuiltValue()
abstract class InvitationDto
    implements Built<InvitationDto, InvitationDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'email')
  String get email;

  @BuiltValueField(wireName: r'entityType')
  String get entityType;

  @BuiltValueField(wireName: r'entityId')
  String get entityId;

  @BuiltValueField(wireName: r'role')
  JsonObject? get role;

  @BuiltValueField(wireName: r'invitedById')
  String get invitedById;

  @BuiltValueField(wireName: r'status')
  InvitationDtoStatusEnum get status;
  // enum statusEnum {  PENDING,  ACCEPTED,  EXPIRED,  REVOKED,  };

  @BuiltValueField(wireName: r'expiresAt')
  String get expiresAt;

  @BuiltValueField(wireName: r'acceptedAt')
  JsonObject? get acceptedAt;

  @BuiltValueField(wireName: r'acceptedById')
  JsonObject? get acceptedById;

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  @BuiltValueField(wireName: r'updatedAt')
  String get updatedAt;

  InvitationDto._();

  factory InvitationDto([void updates(InvitationDtoBuilder b)]) =
      _$InvitationDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(InvitationDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<InvitationDto> get serializer =>
      _$InvitationDtoSerializer();
}

class _$InvitationDtoSerializer implements PrimitiveSerializer<InvitationDto> {
  @override
  final Iterable<Type> types = const [InvitationDto, _$InvitationDto];

  @override
  final String wireName = r'InvitationDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    InvitationDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'email';
    yield serializers.serialize(
      object.email,
      specifiedType: const FullType(String),
    );
    yield r'entityType';
    yield serializers.serialize(
      object.entityType,
      specifiedType: const FullType(String),
    );
    yield r'entityId';
    yield serializers.serialize(
      object.entityId,
      specifiedType: const FullType(String),
    );
    if (object.role != null) {
      yield r'role';
      yield serializers.serialize(
        object.role,
        specifiedType: const FullType(JsonObject),
      );
    }
    yield r'invitedById';
    yield serializers.serialize(
      object.invitedById,
      specifiedType: const FullType(String),
    );
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(InvitationDtoStatusEnum),
    );
    yield r'expiresAt';
    yield serializers.serialize(
      object.expiresAt,
      specifiedType: const FullType(String),
    );
    if (object.acceptedAt != null) {
      yield r'acceptedAt';
      yield serializers.serialize(
        object.acceptedAt,
        specifiedType: const FullType(JsonObject),
      );
    }
    if (object.acceptedById != null) {
      yield r'acceptedById';
      yield serializers.serialize(
        object.acceptedById,
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
  }

  @override
  Object serialize(
    Serializers serializers,
    InvitationDto object, {
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
    required InvitationDtoBuilder result,
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
        case r'email':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.email = valueDes;
          break;
        case r'entityType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.entityType = valueDes;
          break;
        case r'entityId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.entityId = valueDes;
          break;
        case r'role':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.role = valueDes;
          break;
        case r'invitedById':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.invitedById = valueDes;
          break;
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(InvitationDtoStatusEnum),
          ) as InvitationDtoStatusEnum;
          result.status = valueDes;
          break;
        case r'expiresAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.expiresAt = valueDes;
          break;
        case r'acceptedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.acceptedAt = valueDes;
          break;
        case r'acceptedById':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.acceptedById = valueDes;
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
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  InvitationDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = InvitationDtoBuilder();
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

class InvitationDtoStatusEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'PENDING')
  static const InvitationDtoStatusEnum PENDING =
      _$invitationDtoStatusEnum_PENDING;
  @BuiltValueEnumConst(wireName: r'ACCEPTED')
  static const InvitationDtoStatusEnum ACCEPTED =
      _$invitationDtoStatusEnum_ACCEPTED;
  @BuiltValueEnumConst(wireName: r'EXPIRED')
  static const InvitationDtoStatusEnum EXPIRED =
      _$invitationDtoStatusEnum_EXPIRED;
  @BuiltValueEnumConst(wireName: r'REVOKED')
  static const InvitationDtoStatusEnum REVOKED =
      _$invitationDtoStatusEnum_REVOKED;

  static Serializer<InvitationDtoStatusEnum> get serializer =>
      _$invitationDtoStatusEnumSerializer;

  const InvitationDtoStatusEnum._(String name) : super(name);

  static BuiltSet<InvitationDtoStatusEnum> get values =>
      _$invitationDtoStatusEnumValues;
  static InvitationDtoStatusEnum valueOf(String name) =>
      _$invitationDtoStatusEnumValueOf(name);
}
