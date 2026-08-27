//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'mfa_setup_response_dto.g.dart';

/// MfaSetupResponseDto
///
/// Properties:
/// * [otpauthUrl]
/// * [secret]
@BuiltValue()
abstract class MfaSetupResponseDto
    implements Built<MfaSetupResponseDto, MfaSetupResponseDtoBuilder> {
  @BuiltValueField(wireName: r'otpauthUrl')
  String get otpauthUrl;

  @BuiltValueField(wireName: r'secret')
  String get secret;

  MfaSetupResponseDto._();

  factory MfaSetupResponseDto([void updates(MfaSetupResponseDtoBuilder b)]) =
      _$MfaSetupResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MfaSetupResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MfaSetupResponseDto> get serializer =>
      _$MfaSetupResponseDtoSerializer();
}

class _$MfaSetupResponseDtoSerializer
    implements PrimitiveSerializer<MfaSetupResponseDto> {
  @override
  final Iterable<Type> types = const [
    MfaSetupResponseDto,
    _$MfaSetupResponseDto,
  ];

  @override
  final String wireName = r'MfaSetupResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MfaSetupResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'otpauthUrl';
    yield serializers.serialize(
      object.otpauthUrl,
      specifiedType: const FullType(String),
    );
    yield r'secret';
    yield serializers.serialize(
      object.secret,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MfaSetupResponseDto object, {
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
    required MfaSetupResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'otpauthUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.otpauthUrl = valueDes;
          break;
        case r'secret':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.secret = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MfaSetupResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MfaSetupResponseDtoBuilder();
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
