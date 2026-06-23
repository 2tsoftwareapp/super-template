//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'mfa_status_dto.g.dart';

/// MfaStatusDto
///
/// Properties:
/// * [enabled]
@BuiltValue()
abstract class MfaStatusDto
    implements Built<MfaStatusDto, MfaStatusDtoBuilder> {
  @BuiltValueField(wireName: r'enabled')
  bool get enabled;

  MfaStatusDto._();

  factory MfaStatusDto([void updates(MfaStatusDtoBuilder b)]) = _$MfaStatusDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MfaStatusDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MfaStatusDto> get serializer => _$MfaStatusDtoSerializer();
}

class _$MfaStatusDtoSerializer implements PrimitiveSerializer<MfaStatusDto> {
  @override
  final Iterable<Type> types = const [MfaStatusDto, _$MfaStatusDto];

  @override
  final String wireName = r'MfaStatusDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MfaStatusDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'enabled';
    yield serializers.serialize(
      object.enabled,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MfaStatusDto object, {
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
    required MfaStatusDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'enabled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.enabled = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MfaStatusDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MfaStatusDtoBuilder();
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
