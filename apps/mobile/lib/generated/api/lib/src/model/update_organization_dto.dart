//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_organization_dto.g.dart';

/// UpdateOrganizationDto
///
/// Properties:
/// * [name]
@BuiltValue()
abstract class UpdateOrganizationDto
    implements Built<UpdateOrganizationDto, UpdateOrganizationDtoBuilder> {
  @BuiltValueField(wireName: r'name')
  String get name;

  UpdateOrganizationDto._();

  factory UpdateOrganizationDto([
    void updates(UpdateOrganizationDtoBuilder b),
  ]) = _$UpdateOrganizationDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateOrganizationDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateOrganizationDto> get serializer =>
      _$UpdateOrganizationDtoSerializer();
}

class _$UpdateOrganizationDtoSerializer
    implements PrimitiveSerializer<UpdateOrganizationDto> {
  @override
  final Iterable<Type> types = const [
    UpdateOrganizationDto,
    _$UpdateOrganizationDto,
  ];

  @override
  final String wireName = r'UpdateOrganizationDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateOrganizationDto object, {
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
    UpdateOrganizationDto object, {
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
    required UpdateOrganizationDtoBuilder result,
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
  UpdateOrganizationDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateOrganizationDtoBuilder();
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
