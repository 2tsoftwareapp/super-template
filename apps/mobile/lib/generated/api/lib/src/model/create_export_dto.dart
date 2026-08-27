//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_export_dto.g.dart';

/// CreateExportDto
///
/// Properties:
/// * [filters]
/// * [idempotencyKey] - Client-supplied idempotency key. Retries with the same key return the original export job.
/// * [type]
@BuiltValue()
abstract class CreateExportDto
    implements Built<CreateExportDto, CreateExportDtoBuilder> {
  @BuiltValueField(wireName: r'filters')
  BuiltMap<String, JsonObject?>? get filters;

  /// Client-supplied idempotency key. Retries with the same key return the original export job.
  @BuiltValueField(wireName: r'idempotencyKey')
  String? get idempotencyKey;

  @BuiltValueField(wireName: r'type')
  String get type;

  CreateExportDto._();

  factory CreateExportDto([void updates(CreateExportDtoBuilder b)]) =
      _$CreateExportDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateExportDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateExportDto> get serializer =>
      _$CreateExportDtoSerializer();
}

class _$CreateExportDtoSerializer
    implements PrimitiveSerializer<CreateExportDto> {
  @override
  final Iterable<Type> types = const [CreateExportDto, _$CreateExportDto];

  @override
  final String wireName = r'CreateExportDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateExportDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.filters != null) {
      yield r'filters';
      yield serializers.serialize(
        object.filters,
        specifiedType: const FullType(BuiltMap, [
          FullType(String),
          FullType.nullable(JsonObject),
        ]),
      );
    }
    if (object.idempotencyKey != null) {
      yield r'idempotencyKey';
      yield serializers.serialize(
        object.idempotencyKey,
        specifiedType: const FullType(String),
      );
    }
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateExportDto object, {
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
    required CreateExportDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'filters':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltMap, [
              FullType(String),
              FullType.nullable(JsonObject),
            ]),
          ) as BuiltMap<String, JsonObject?>;
          result.filters.replace(valueDes);
          break;
        case r'idempotencyKey':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.idempotencyKey = valueDes;
          break;
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.type = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateExportDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateExportDtoBuilder();
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
