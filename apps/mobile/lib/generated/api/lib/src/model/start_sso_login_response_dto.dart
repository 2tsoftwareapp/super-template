//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'start_sso_login_response_dto.g.dart';

/// StartSsoLoginResponseDto
///
/// Properties:
/// * [authorizationUrl]
@BuiltValue()
abstract class StartSsoLoginResponseDto
    implements
        Built<StartSsoLoginResponseDto, StartSsoLoginResponseDtoBuilder> {
  @BuiltValueField(wireName: r'authorizationUrl')
  String get authorizationUrl;

  StartSsoLoginResponseDto._();

  factory StartSsoLoginResponseDto([
    void updates(StartSsoLoginResponseDtoBuilder b),
  ]) = _$StartSsoLoginResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(StartSsoLoginResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<StartSsoLoginResponseDto> get serializer =>
      _$StartSsoLoginResponseDtoSerializer();
}

class _$StartSsoLoginResponseDtoSerializer
    implements PrimitiveSerializer<StartSsoLoginResponseDto> {
  @override
  final Iterable<Type> types = const [
    StartSsoLoginResponseDto,
    _$StartSsoLoginResponseDto,
  ];

  @override
  final String wireName = r'StartSsoLoginResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    StartSsoLoginResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'authorizationUrl';
    yield serializers.serialize(
      object.authorizationUrl,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    StartSsoLoginResponseDto object, {
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
    required StartSsoLoginResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'authorizationUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.authorizationUrl = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  StartSsoLoginResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = StartSsoLoginResponseDtoBuilder();
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
