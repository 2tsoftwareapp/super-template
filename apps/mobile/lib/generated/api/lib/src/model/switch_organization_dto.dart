//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'switch_organization_dto.g.dart';

/// SwitchOrganizationDto
///
/// Properties:
/// * [organizationId]
@BuiltValue()
abstract class SwitchOrganizationDto
    implements Built<SwitchOrganizationDto, SwitchOrganizationDtoBuilder> {
  @BuiltValueField(wireName: r'organizationId')
  String get organizationId;

  SwitchOrganizationDto._();

  factory SwitchOrganizationDto([
    void updates(SwitchOrganizationDtoBuilder b),
  ]) = _$SwitchOrganizationDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SwitchOrganizationDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SwitchOrganizationDto> get serializer =>
      _$SwitchOrganizationDtoSerializer();
}

class _$SwitchOrganizationDtoSerializer
    implements PrimitiveSerializer<SwitchOrganizationDto> {
  @override
  final Iterable<Type> types = const [
    SwitchOrganizationDto,
    _$SwitchOrganizationDto,
  ];

  @override
  final String wireName = r'SwitchOrganizationDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SwitchOrganizationDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'organizationId';
    yield serializers.serialize(
      object.organizationId,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SwitchOrganizationDto object, {
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
    required SwitchOrganizationDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'organizationId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.organizationId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SwitchOrganizationDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SwitchOrganizationDtoBuilder();
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
