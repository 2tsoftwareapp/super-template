//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'mfa_recovery_codes_response_dto.g.dart';

/// MfaRecoveryCodesResponseDto
///
/// Properties:
/// * [recoveryCodes]
@BuiltValue()
abstract class MfaRecoveryCodesResponseDto
    implements
        Built<MfaRecoveryCodesResponseDto, MfaRecoveryCodesResponseDtoBuilder> {
  @BuiltValueField(wireName: r'recoveryCodes')
  BuiltList<String> get recoveryCodes;

  MfaRecoveryCodesResponseDto._();

  factory MfaRecoveryCodesResponseDto([
    void updates(MfaRecoveryCodesResponseDtoBuilder b),
  ]) = _$MfaRecoveryCodesResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MfaRecoveryCodesResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MfaRecoveryCodesResponseDto> get serializer =>
      _$MfaRecoveryCodesResponseDtoSerializer();
}

class _$MfaRecoveryCodesResponseDtoSerializer
    implements PrimitiveSerializer<MfaRecoveryCodesResponseDto> {
  @override
  final Iterable<Type> types = const [
    MfaRecoveryCodesResponseDto,
    _$MfaRecoveryCodesResponseDto,
  ];

  @override
  final String wireName = r'MfaRecoveryCodesResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MfaRecoveryCodesResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'recoveryCodes';
    yield serializers.serialize(
      object.recoveryCodes,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MfaRecoveryCodesResponseDto object, {
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
    required MfaRecoveryCodesResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'recoveryCodes':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [
              FullType(String),
            ]),
          ) as BuiltList<String>;
          result.recoveryCodes.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MfaRecoveryCodesResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MfaRecoveryCodesResponseDtoBuilder();
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
