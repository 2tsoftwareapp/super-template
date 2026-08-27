//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'verify_mfa_challenge_dto.g.dart';

/// VerifyMfaChallengeDto
///
/// Properties:
/// * [code]
/// * [mfaToken]
@BuiltValue()
abstract class VerifyMfaChallengeDto
    implements Built<VerifyMfaChallengeDto, VerifyMfaChallengeDtoBuilder> {
  @BuiltValueField(wireName: r'code')
  String get code;

  @BuiltValueField(wireName: r'mfaToken')
  String get mfaToken;

  VerifyMfaChallengeDto._();

  factory VerifyMfaChallengeDto([
    void updates(VerifyMfaChallengeDtoBuilder b),
  ]) = _$VerifyMfaChallengeDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(VerifyMfaChallengeDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<VerifyMfaChallengeDto> get serializer =>
      _$VerifyMfaChallengeDtoSerializer();
}

class _$VerifyMfaChallengeDtoSerializer
    implements PrimitiveSerializer<VerifyMfaChallengeDto> {
  @override
  final Iterable<Type> types = const [
    VerifyMfaChallengeDto,
    _$VerifyMfaChallengeDto,
  ];

  @override
  final String wireName = r'VerifyMfaChallengeDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    VerifyMfaChallengeDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'code';
    yield serializers.serialize(
      object.code,
      specifiedType: const FullType(String),
    );
    yield r'mfaToken';
    yield serializers.serialize(
      object.mfaToken,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    VerifyMfaChallengeDto object, {
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
    required VerifyMfaChallengeDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'code':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.code = valueDes;
          break;
        case r'mfaToken':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.mfaToken = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  VerifyMfaChallengeDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = VerifyMfaChallengeDtoBuilder();
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
