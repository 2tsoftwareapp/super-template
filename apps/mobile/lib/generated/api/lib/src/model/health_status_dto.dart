//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'health_status_dto.g.dart';

/// HealthStatusDto
///
/// Properties:
/// * [status]
@BuiltValue()
abstract class HealthStatusDto
    implements Built<HealthStatusDto, HealthStatusDtoBuilder> {
  @BuiltValueField(wireName: r'status')
  HealthStatusDtoStatusEnum get status;
  // enum statusEnum {  ok,  ready,  };

  HealthStatusDto._();

  factory HealthStatusDto([void updates(HealthStatusDtoBuilder b)]) =
      _$HealthStatusDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(HealthStatusDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<HealthStatusDto> get serializer =>
      _$HealthStatusDtoSerializer();
}

class _$HealthStatusDtoSerializer
    implements PrimitiveSerializer<HealthStatusDto> {
  @override
  final Iterable<Type> types = const [HealthStatusDto, _$HealthStatusDto];

  @override
  final String wireName = r'HealthStatusDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    HealthStatusDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(HealthStatusDtoStatusEnum),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    HealthStatusDto object, {
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
    required HealthStatusDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(HealthStatusDtoStatusEnum),
          ) as HealthStatusDtoStatusEnum;
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
  HealthStatusDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = HealthStatusDtoBuilder();
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

class HealthStatusDtoStatusEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'ok')
  static const HealthStatusDtoStatusEnum ok = _$healthStatusDtoStatusEnum_ok;
  @BuiltValueEnumConst(wireName: r'ready')
  static const HealthStatusDtoStatusEnum ready =
      _$healthStatusDtoStatusEnum_ready;

  static Serializer<HealthStatusDtoStatusEnum> get serializer =>
      _$healthStatusDtoStatusEnumSerializer;

  const HealthStatusDtoStatusEnum._(String name) : super(name);

  static BuiltSet<HealthStatusDtoStatusEnum> get values =>
      _$healthStatusDtoStatusEnumValues;
  static HealthStatusDtoStatusEnum valueOf(String name) =>
      _$healthStatusDtoStatusEnumValueOf(name);
}
