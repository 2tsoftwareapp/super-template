//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'switch_organization_response_dto.g.dart';

/// SwitchOrganizationResponseDto
///
/// Properties:
/// * [accessToken]
/// * [organizationId]
/// * [refreshToken]
@BuiltValue()
abstract class SwitchOrganizationResponseDto
    implements
        Built<SwitchOrganizationResponseDto,
            SwitchOrganizationResponseDtoBuilder> {
  @BuiltValueField(wireName: r'accessToken')
  String get accessToken;

  @BuiltValueField(wireName: r'organizationId')
  String get organizationId;

  @BuiltValueField(wireName: r'refreshToken')
  String get refreshToken;

  SwitchOrganizationResponseDto._();

  factory SwitchOrganizationResponseDto([
    void updates(SwitchOrganizationResponseDtoBuilder b),
  ]) = _$SwitchOrganizationResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SwitchOrganizationResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SwitchOrganizationResponseDto> get serializer =>
      _$SwitchOrganizationResponseDtoSerializer();
}

class _$SwitchOrganizationResponseDtoSerializer
    implements PrimitiveSerializer<SwitchOrganizationResponseDto> {
  @override
  final Iterable<Type> types = const [
    SwitchOrganizationResponseDto,
    _$SwitchOrganizationResponseDto,
  ];

  @override
  final String wireName = r'SwitchOrganizationResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SwitchOrganizationResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'accessToken';
    yield serializers.serialize(
      object.accessToken,
      specifiedType: const FullType(String),
    );
    yield r'organizationId';
    yield serializers.serialize(
      object.organizationId,
      specifiedType: const FullType(String),
    );
    yield r'refreshToken';
    yield serializers.serialize(
      object.refreshToken,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SwitchOrganizationResponseDto object, {
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
    required SwitchOrganizationResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'accessToken':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.accessToken = valueDes;
          break;
        case r'organizationId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.organizationId = valueDes;
          break;
        case r'refreshToken':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.refreshToken = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SwitchOrganizationResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SwitchOrganizationResponseDtoBuilder();
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
