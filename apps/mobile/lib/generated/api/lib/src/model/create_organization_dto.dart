//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_organization_dto.g.dart';

/// CreateOrganizationDto
///
/// Properties:
/// * [name]
@BuiltValue()
abstract class CreateOrganizationDto
    implements Built<CreateOrganizationDto, CreateOrganizationDtoBuilder> {
  @BuiltValueField(wireName: r'name')
  String get name;

  CreateOrganizationDto._();

  factory CreateOrganizationDto([
    void updates(CreateOrganizationDtoBuilder b),
  ]) = _$CreateOrganizationDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateOrganizationDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateOrganizationDto> get serializer =>
      _$CreateOrganizationDtoSerializer();
}

class _$CreateOrganizationDtoSerializer
    implements PrimitiveSerializer<CreateOrganizationDto> {
  @override
  final Iterable<Type> types = const [
    CreateOrganizationDto,
    _$CreateOrganizationDto,
  ];

  @override
  final String wireName = r'CreateOrganizationDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateOrganizationDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateOrganizationDto object, {
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
    required CreateOrganizationDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.name = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateOrganizationDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateOrganizationDtoBuilder();
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
