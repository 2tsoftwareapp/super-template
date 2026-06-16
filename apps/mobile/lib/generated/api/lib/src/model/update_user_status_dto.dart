//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_user_status_dto.g.dart';

/// UpdateUserStatusDto
///
/// Properties:
/// * [status]
@BuiltValue()
abstract class UpdateUserStatusDto
    implements Built<UpdateUserStatusDto, UpdateUserStatusDtoBuilder> {
  @BuiltValueField(wireName: r'status')
  UpdateUserStatusDtoStatusEnum get status;
  // enum statusEnum {  PENDING,  ACTIVE,  BLOCKED,  };

  UpdateUserStatusDto._();

  factory UpdateUserStatusDto([void updates(UpdateUserStatusDtoBuilder b)]) =
      _$UpdateUserStatusDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateUserStatusDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateUserStatusDto> get serializer =>
      _$UpdateUserStatusDtoSerializer();
}

class _$UpdateUserStatusDtoSerializer
    implements PrimitiveSerializer<UpdateUserStatusDto> {
  @override
  final Iterable<Type> types = const [
    UpdateUserStatusDto,
    _$UpdateUserStatusDto
  ];

  @override
  final String wireName = r'UpdateUserStatusDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateUserStatusDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(UpdateUserStatusDtoStatusEnum),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdateUserStatusDto object, {
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
    required UpdateUserStatusDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UpdateUserStatusDtoStatusEnum),
          ) as UpdateUserStatusDtoStatusEnum;
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
  UpdateUserStatusDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateUserStatusDtoBuilder();
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

class UpdateUserStatusDtoStatusEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'PENDING')
  static const UpdateUserStatusDtoStatusEnum PENDING =
      _$updateUserStatusDtoStatusEnum_PENDING;
  @BuiltValueEnumConst(wireName: r'ACTIVE')
  static const UpdateUserStatusDtoStatusEnum ACTIVE =
      _$updateUserStatusDtoStatusEnum_ACTIVE;
  @BuiltValueEnumConst(wireName: r'BLOCKED')
  static const UpdateUserStatusDtoStatusEnum BLOCKED =
      _$updateUserStatusDtoStatusEnum_BLOCKED;

  static Serializer<UpdateUserStatusDtoStatusEnum> get serializer =>
      _$updateUserStatusDtoStatusEnumSerializer;

  const UpdateUserStatusDtoStatusEnum._(String name) : super(name);

  static BuiltSet<UpdateUserStatusDtoStatusEnum> get values =>
      _$updateUserStatusDtoStatusEnumValues;
  static UpdateUserStatusDtoStatusEnum valueOf(String name) =>
      _$updateUserStatusDtoStatusEnumValueOf(name);
}
