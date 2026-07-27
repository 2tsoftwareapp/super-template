//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_import_dto.g.dart';

/// CreateImportDto
///
/// Properties:
/// * [type]
/// * [fileId]
/// * [idempotencyKey] - Client-supplied idempotency key. Retries with the same key return the original import job.
@BuiltValue()
abstract class CreateImportDto
    implements Built<CreateImportDto, CreateImportDtoBuilder> {
  @BuiltValueField(wireName: r'type')
  CreateImportDtoTypeEnum get type;

  @BuiltValueField(wireName: r'fileId')
  String get fileId;

  /// Client-supplied idempotency key. Retries with the same key return the original import job.
  @BuiltValueField(wireName: r'idempotencyKey')
  String? get idempotencyKey;

  CreateImportDto._();

  factory CreateImportDto([void updates(CreateImportDtoBuilder b)]) =
      _$CreateImportDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateImportDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateImportDto> get serializer =>
      _$CreateImportDtoSerializer();
}

class _$CreateImportDtoSerializer
    implements PrimitiveSerializer<CreateImportDto> {
  @override
  final Iterable<Type> types = const [CreateImportDto, _$CreateImportDto];

  @override
  final String wireName = r'CreateImportDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateImportDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(CreateImportDtoTypeEnum),
    );
    yield r'fileId';
    yield serializers.serialize(
      object.fileId,
      specifiedType: const FullType(String),
    );
    if (object.idempotencyKey != null) {
      yield r'idempotencyKey';
      yield serializers.serialize(
        object.idempotencyKey,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateImportDto object, {
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
    required CreateImportDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CreateImportDtoTypeEnum),
          ) as CreateImportDtoTypeEnum;
          result.type = valueDes;
          break;
        case r'fileId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.fileId = valueDes;
          break;
        case r'idempotencyKey':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.idempotencyKey = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateImportDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateImportDtoBuilder();
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

class CreateImportDtoTypeEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'users')
  static const CreateImportDtoTypeEnum users = _$createImportDtoTypeEnum_users;

  static Serializer<CreateImportDtoTypeEnum> get serializer =>
      _$createImportDtoTypeEnumSerializer;

  const CreateImportDtoTypeEnum._(String name) : super(name);

  static BuiltSet<CreateImportDtoTypeEnum> get values =>
      _$createImportDtoTypeEnumValues;
  static CreateImportDtoTypeEnum valueOf(String name) =>
      _$createImportDtoTypeEnumValueOf(name);
}
