//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_admin_user_dto.g.dart';

/// UpdateAdminUserDto
///
/// Properties:
/// * [email]
/// * [password]
/// * [displayName]
/// * [avatarUrl]
/// * [status]
/// * [roleIds]
@BuiltValue()
abstract class UpdateAdminUserDto
    implements Built<UpdateAdminUserDto, UpdateAdminUserDtoBuilder> {
  @BuiltValueField(wireName: r'email')
  String? get email;

  @BuiltValueField(wireName: r'password')
  String? get password;

  @BuiltValueField(wireName: r'displayName')
  String? get displayName;

  @BuiltValueField(wireName: r'avatarUrl')
  JsonObject? get avatarUrl;

  @BuiltValueField(wireName: r'status')
  UpdateAdminUserDtoStatusEnum? get status;
  // enum statusEnum {  PENDING,  ACTIVE,  BLOCKED,  };

  @BuiltValueField(wireName: r'roleIds')
  BuiltList<String>? get roleIds;

  UpdateAdminUserDto._();

  factory UpdateAdminUserDto([void updates(UpdateAdminUserDtoBuilder b)]) =
      _$UpdateAdminUserDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateAdminUserDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateAdminUserDto> get serializer =>
      _$UpdateAdminUserDtoSerializer();
}

class _$UpdateAdminUserDtoSerializer
    implements PrimitiveSerializer<UpdateAdminUserDto> {
  @override
  final Iterable<Type> types = const [UpdateAdminUserDto, _$UpdateAdminUserDto];

  @override
  final String wireName = r'UpdateAdminUserDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateAdminUserDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.email != null) {
      yield r'email';
      yield serializers.serialize(
        object.email,
        specifiedType: const FullType(String),
      );
    }
    if (object.password != null) {
      yield r'password';
      yield serializers.serialize(
        object.password,
        specifiedType: const FullType(String),
      );
    }
    if (object.displayName != null) {
      yield r'displayName';
      yield serializers.serialize(
        object.displayName,
        specifiedType: const FullType(String),
      );
    }
    if (object.avatarUrl != null) {
      yield r'avatarUrl';
      yield serializers.serialize(
        object.avatarUrl,
        specifiedType: const FullType(JsonObject),
      );
    }
    if (object.status != null) {
      yield r'status';
      yield serializers.serialize(
        object.status,
        specifiedType: const FullType(UpdateAdminUserDtoStatusEnum),
      );
    }
    if (object.roleIds != null) {
      yield r'roleIds';
      yield serializers.serialize(
        object.roleIds,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdateAdminUserDto object, {
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
    required UpdateAdminUserDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'email':
          final valueDes =
              serializers.deserialize(
                    value,
                    specifiedType: const FullType(String),
                  )
                  as String;
          result.email = valueDes;
          break;
        case r'password':
          final valueDes =
              serializers.deserialize(
                    value,
                    specifiedType: const FullType(String),
                  )
                  as String;
          result.password = valueDes;
          break;
        case r'displayName':
          final valueDes =
              serializers.deserialize(
                    value,
                    specifiedType: const FullType(String),
                  )
                  as String;
          result.displayName = valueDes;
          break;
        case r'avatarUrl':
          final valueDes =
              serializers.deserialize(
                    value,
                    specifiedType: const FullType(JsonObject),
                  )
                  as JsonObject;
          result.avatarUrl = valueDes;
          break;
        case r'status':
          final valueDes =
              serializers.deserialize(
                    value,
                    specifiedType: const FullType(UpdateAdminUserDtoStatusEnum),
                  )
                  as UpdateAdminUserDtoStatusEnum;
          result.status = valueDes;
          break;
        case r'roleIds':
          final valueDes =
              serializers.deserialize(
                    value,
                    specifiedType: const FullType(BuiltList, [
                      FullType(String),
                    ]),
                  )
                  as BuiltList<String>;
          result.roleIds.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpdateAdminUserDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateAdminUserDtoBuilder();
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

class UpdateAdminUserDtoStatusEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'PENDING')
  static const UpdateAdminUserDtoStatusEnum PENDING =
      _$updateAdminUserDtoStatusEnum_PENDING;
  @BuiltValueEnumConst(wireName: r'ACTIVE')
  static const UpdateAdminUserDtoStatusEnum ACTIVE =
      _$updateAdminUserDtoStatusEnum_ACTIVE;
  @BuiltValueEnumConst(wireName: r'BLOCKED')
  static const UpdateAdminUserDtoStatusEnum BLOCKED =
      _$updateAdminUserDtoStatusEnum_BLOCKED;

  static Serializer<UpdateAdminUserDtoStatusEnum> get serializer =>
      _$updateAdminUserDtoStatusEnumSerializer;

  const UpdateAdminUserDtoStatusEnum._(String name) : super(name);

  static BuiltSet<UpdateAdminUserDtoStatusEnum> get values =>
      _$updateAdminUserDtoStatusEnumValues;
  static UpdateAdminUserDtoStatusEnum valueOf(String name) =>
      _$updateAdminUserDtoStatusEnumValueOf(name);
}
