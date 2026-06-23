//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'add_job_dependency_dto.g.dart';

/// AddJobDependencyDto
///
/// Properties:
/// * [dependsOnJobId]
@BuiltValue()
abstract class AddJobDependencyDto
    implements Built<AddJobDependencyDto, AddJobDependencyDtoBuilder> {
  @BuiltValueField(wireName: r'dependsOnJobId')
  String get dependsOnJobId;

  AddJobDependencyDto._();

  factory AddJobDependencyDto([void updates(AddJobDependencyDtoBuilder b)]) =
      _$AddJobDependencyDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AddJobDependencyDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AddJobDependencyDto> get serializer =>
      _$AddJobDependencyDtoSerializer();
}

class _$AddJobDependencyDtoSerializer
    implements PrimitiveSerializer<AddJobDependencyDto> {
  @override
  final Iterable<Type> types = const [
    AddJobDependencyDto,
    _$AddJobDependencyDto,
  ];

  @override
  final String wireName = r'AddJobDependencyDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AddJobDependencyDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'dependsOnJobId';
    yield serializers.serialize(
      object.dependsOnJobId,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AddJobDependencyDto object, {
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
    required AddJobDependencyDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'dependsOnJobId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.dependsOnJobId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AddJobDependencyDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AddJobDependencyDtoBuilder();
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
