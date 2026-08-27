//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'device_token_dto.g.dart';

/// DeviceTokenDto
///
/// Properties:
/// * [id]
/// * [lastUsedAt]
/// * [platform]
/// * [token]
@BuiltValue()
abstract class DeviceTokenDto
    implements Built<DeviceTokenDto, DeviceTokenDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'lastUsedAt')
  String get lastUsedAt;

  @BuiltValueField(wireName: r'platform')
  DeviceTokenDtoPlatformEnum get platform;
  // enum platformEnum {  IOS,  ANDROID,  };

  @BuiltValueField(wireName: r'token')
  String get token;

  DeviceTokenDto._();

  factory DeviceTokenDto([void updates(DeviceTokenDtoBuilder b)]) =
      _$DeviceTokenDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DeviceTokenDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DeviceTokenDto> get serializer =>
      _$DeviceTokenDtoSerializer();
}

class _$DeviceTokenDtoSerializer
    implements PrimitiveSerializer<DeviceTokenDto> {
  @override
  final Iterable<Type> types = const [DeviceTokenDto, _$DeviceTokenDto];

  @override
  final String wireName = r'DeviceTokenDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DeviceTokenDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'lastUsedAt';
    yield serializers.serialize(
      object.lastUsedAt,
      specifiedType: const FullType(String),
    );
    yield r'platform';
    yield serializers.serialize(
      object.platform,
      specifiedType: const FullType(DeviceTokenDtoPlatformEnum),
    );
    yield r'token';
    yield serializers.serialize(
      object.token,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DeviceTokenDto object, {
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
    required DeviceTokenDtoBuilder result,
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
        case r'lastUsedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.lastUsedAt = valueDes;
          break;
        case r'platform':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DeviceTokenDtoPlatformEnum),
          ) as DeviceTokenDtoPlatformEnum;
          result.platform = valueDes;
          break;
        case r'token':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.token = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DeviceTokenDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DeviceTokenDtoBuilder();
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

class DeviceTokenDtoPlatformEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'IOS')
  static const DeviceTokenDtoPlatformEnum IOS =
      _$deviceTokenDtoPlatformEnum_IOS;
  @BuiltValueEnumConst(wireName: r'ANDROID')
  static const DeviceTokenDtoPlatformEnum ANDROID =
      _$deviceTokenDtoPlatformEnum_ANDROID;

  static Serializer<DeviceTokenDtoPlatformEnum> get serializer =>
      _$deviceTokenDtoPlatformEnumSerializer;

  const DeviceTokenDtoPlatformEnum._(String name) : super(name);

  static BuiltSet<DeviceTokenDtoPlatformEnum> get values =>
      _$deviceTokenDtoPlatformEnumValues;
  static DeviceTokenDtoPlatformEnum valueOf(String name) =>
      _$deviceTokenDtoPlatformEnumValueOf(name);
}
