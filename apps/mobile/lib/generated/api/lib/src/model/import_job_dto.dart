//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'import_job_dto.g.dart';

/// ImportJobDto
///
/// Properties:
/// * [id]
/// * [type]
/// * [fileId]
/// * [status]
/// * [rowCount]
/// * [successCount]
/// * [errorCount]
/// * [errors]
/// * [createdById]
/// * [confirmedAt]
/// * [completedAt]
/// * [createdAt]
/// * [updatedAt]
@BuiltValue()
abstract class ImportJobDto
    implements Built<ImportJobDto, ImportJobDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'type')
  String get type;

  @BuiltValueField(wireName: r'fileId')
  String get fileId;

  @BuiltValueField(wireName: r'status')
  ImportJobDtoStatusEnum get status;
  // enum statusEnum {  PENDING,  PROCESSING,  COMPLETED,  FAILED,  CANCELLED,  };

  @BuiltValueField(wireName: r'rowCount')
  JsonObject? get rowCount;

  @BuiltValueField(wireName: r'successCount')
  JsonObject? get successCount;

  @BuiltValueField(wireName: r'errorCount')
  JsonObject? get errorCount;

  @BuiltValueField(wireName: r'errors')
  BuiltList<JsonObject>? get errors;

  @BuiltValueField(wireName: r'createdById')
  String get createdById;

  @BuiltValueField(wireName: r'confirmedAt')
  JsonObject? get confirmedAt;

  @BuiltValueField(wireName: r'completedAt')
  JsonObject? get completedAt;

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  @BuiltValueField(wireName: r'updatedAt')
  String get updatedAt;

  ImportJobDto._();

  factory ImportJobDto([void updates(ImportJobDtoBuilder b)]) = _$ImportJobDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ImportJobDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ImportJobDto> get serializer => _$ImportJobDtoSerializer();
}

class _$ImportJobDtoSerializer implements PrimitiveSerializer<ImportJobDto> {
  @override
  final Iterable<Type> types = const [ImportJobDto, _$ImportJobDto];

  @override
  final String wireName = r'ImportJobDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ImportJobDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(String),
    );
    yield r'fileId';
    yield serializers.serialize(
      object.fileId,
      specifiedType: const FullType(String),
    );
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(ImportJobDtoStatusEnum),
    );
    if (object.rowCount != null) {
      yield r'rowCount';
      yield serializers.serialize(
        object.rowCount,
        specifiedType: const FullType(JsonObject),
      );
    }
    if (object.successCount != null) {
      yield r'successCount';
      yield serializers.serialize(
        object.successCount,
        specifiedType: const FullType(JsonObject),
      );
    }
    if (object.errorCount != null) {
      yield r'errorCount';
      yield serializers.serialize(
        object.errorCount,
        specifiedType: const FullType(JsonObject),
      );
    }
    if (object.errors != null) {
      yield r'errors';
      yield serializers.serialize(
        object.errors,
        specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
      );
    }
    yield r'createdById';
    yield serializers.serialize(
      object.createdById,
      specifiedType: const FullType(String),
    );
    if (object.confirmedAt != null) {
      yield r'confirmedAt';
      yield serializers.serialize(
        object.confirmedAt,
        specifiedType: const FullType(JsonObject),
      );
    }
    if (object.completedAt != null) {
      yield r'completedAt';
      yield serializers.serialize(
        object.completedAt,
        specifiedType: const FullType(JsonObject),
      );
    }
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
    );
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ImportJobDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object,
            specifiedType: specifiedType)
        .toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ImportJobDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.type = valueDes;
          break;
        case r'fileId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.fileId = valueDes;
          break;
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ImportJobDtoStatusEnum),
          ) as ImportJobDtoStatusEnum;
          result.status = valueDes;
          break;
        case r'rowCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.rowCount = valueDes;
          break;
        case r'successCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.successCount = valueDes;
          break;
        case r'errorCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.errorCount = valueDes;
          break;
        case r'errors':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
          ) as BuiltList<JsonObject>;
          result.errors.replace(valueDes);
          break;
        case r'createdById':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdById = valueDes;
          break;
        case r'confirmedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.confirmedAt = valueDes;
          break;
        case r'completedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.completedAt = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdAt = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.updatedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ImportJobDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ImportJobDtoBuilder();
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

class ImportJobDtoStatusEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'PENDING')
  static const ImportJobDtoStatusEnum PENDING =
      _$importJobDtoStatusEnum_PENDING;
  @BuiltValueEnumConst(wireName: r'PROCESSING')
  static const ImportJobDtoStatusEnum PROCESSING =
      _$importJobDtoStatusEnum_PROCESSING;
  @BuiltValueEnumConst(wireName: r'COMPLETED')
  static const ImportJobDtoStatusEnum COMPLETED =
      _$importJobDtoStatusEnum_COMPLETED;
  @BuiltValueEnumConst(wireName: r'FAILED')
  static const ImportJobDtoStatusEnum FAILED = _$importJobDtoStatusEnum_FAILED;
  @BuiltValueEnumConst(wireName: r'CANCELLED')
  static const ImportJobDtoStatusEnum CANCELLED =
      _$importJobDtoStatusEnum_CANCELLED;

  static Serializer<ImportJobDtoStatusEnum> get serializer =>
      _$importJobDtoStatusEnumSerializer;

  const ImportJobDtoStatusEnum._(String name) : super(name);

  static BuiltSet<ImportJobDtoStatusEnum> get values =>
      _$importJobDtoStatusEnumValues;
  static ImportJobDtoStatusEnum valueOf(String name) =>
      _$importJobDtoStatusEnumValueOf(name);
}
