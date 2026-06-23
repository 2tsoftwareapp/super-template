//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_invitation_dto.g.dart';

/// CreateInvitationDto
///
/// Properties:
/// * [email]
/// * [entityType]
/// * [entityId]
/// * [role]
@BuiltValue()
abstract class CreateInvitationDto
    implements Built<CreateInvitationDto, CreateInvitationDtoBuilder> {
  @BuiltValueField(wireName: r'email')
  String get email;

  @BuiltValueField(wireName: r'entityType')
  CreateInvitationDtoEntityTypeEnum get entityType;
  // enum entityTypeEnum {  organization,  project,  };

  @BuiltValueField(wireName: r'entityId')
  String get entityId;

  @BuiltValueField(wireName: r'role')
  String? get role;

  CreateInvitationDto._();

  factory CreateInvitationDto([void updates(CreateInvitationDtoBuilder b)]) =
      _$CreateInvitationDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateInvitationDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateInvitationDto> get serializer =>
      _$CreateInvitationDtoSerializer();
}

class _$CreateInvitationDtoSerializer
    implements PrimitiveSerializer<CreateInvitationDto> {
  @override
  final Iterable<Type> types = const [
    CreateInvitationDto,
    _$CreateInvitationDto,
  ];

  @override
  final String wireName = r'CreateInvitationDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateInvitationDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'email';
    yield serializers.serialize(
      object.email,
      specifiedType: const FullType(String),
    );
    yield r'entityType';
    yield serializers.serialize(
      object.entityType,
      specifiedType: const FullType(CreateInvitationDtoEntityTypeEnum),
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
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateInvitationDto object, {
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
    required CreateInvitationDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
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
            specifiedType: const FullType(
              CreateInvitationDtoEntityTypeEnum,
            ),
          ) as CreateInvitationDtoEntityTypeEnum;
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
            specifiedType: const FullType(String),
          ) as String;
          result.role = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateInvitationDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateInvitationDtoBuilder();
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

class CreateInvitationDtoEntityTypeEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'organization')
  static const CreateInvitationDtoEntityTypeEnum organization =
      _$createInvitationDtoEntityTypeEnum_organization;
  @BuiltValueEnumConst(wireName: r'project')
  static const CreateInvitationDtoEntityTypeEnum project =
      _$createInvitationDtoEntityTypeEnum_project;

  static Serializer<CreateInvitationDtoEntityTypeEnum> get serializer =>
      _$createInvitationDtoEntityTypeEnumSerializer;

  const CreateInvitationDtoEntityTypeEnum._(String name) : super(name);

  static BuiltSet<CreateInvitationDtoEntityTypeEnum> get values =>
      _$createInvitationDtoEntityTypeEnumValues;
  static CreateInvitationDtoEntityTypeEnum valueOf(String name) =>
      _$createInvitationDtoEntityTypeEnumValueOf(name);
}
