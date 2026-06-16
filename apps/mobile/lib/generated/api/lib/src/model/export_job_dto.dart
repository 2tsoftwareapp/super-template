//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'export_job_dto.g.dart';

/// ExportJobDto
///
/// Properties:
/// * [id]
/// * [type]
/// * [status]
/// * [fileId]
/// * [filters]
/// * [createdById]
/// * [completedAt]
/// * [createdAt]
/// * [updatedAt]
@BuiltValue()
abstract class ExportJobDto
    implements Built<ExportJobDto, ExportJobDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'type')
  String get type;

  @BuiltValueField(wireName: r'status')
  ExportJobDtoStatusEnum get status;
  // enum statusEnum {  PENDING,  PROCESSING,  COMPLETED,  FAILED,  CANCELLED,  };

  @BuiltValueField(wireName: r'fileId')
  JsonObject? get fileId;

  @BuiltValueField(wireName: r'filters')
  BuiltMap<String, JsonObject?>? get filters;

  @BuiltValueField(wireName: r'createdById')
  String get createdById;

  @BuiltValueField(wireName: r'completedAt')
  JsonObject? get completedAt;

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  @BuiltValueField(wireName: r'updatedAt')
  String get updatedAt;

  ExportJobDto._();

  factory ExportJobDto([void updates(ExportJobDtoBuilder b)]) = _$ExportJobDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ExportJobDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ExportJobDto> get serializer => _$ExportJobDtoSerializer();
}

class _$ExportJobDtoSerializer implements PrimitiveSerializer<ExportJobDto> {
  @override
  final Iterable<Type> types = const [ExportJobDto, _$ExportJobDto];

  @override
  final String wireName = r'ExportJobDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ExportJobDto object, {
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
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(ExportJobDtoStatusEnum),
    );
    if (object.fileId != null) {
      yield r'fileId';
      yield serializers.serialize(
        object.fileId,
        specifiedType: const FullType(JsonObject),
      );
    }
    if (object.filters != null) {
      yield r'filters';
      yield serializers.serialize(
        object.filters,
        specifiedType: const FullType(
            BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
      );
    }
    yield r'createdById';
    yield serializers.serialize(
      object.createdById,
      specifiedType: const FullType(String),
    );
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
    ExportJobDto object, {
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
    required ExportJobDtoBuilder result,
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
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ExportJobDtoStatusEnum),
          ) as ExportJobDtoStatusEnum;
          result.status = valueDes;
          break;
        case r'fileId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.fileId = valueDes;
          break;
        case r'filters':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(
                BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
          ) as BuiltMap<String, JsonObject?>;
          result.filters.replace(valueDes);
          break;
        case r'createdById':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdById = valueDes;
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
  ExportJobDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ExportJobDtoBuilder();
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

class ExportJobDtoStatusEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'PENDING')
  static const ExportJobDtoStatusEnum PENDING =
      _$exportJobDtoStatusEnum_PENDING;
  @BuiltValueEnumConst(wireName: r'PROCESSING')
  static const ExportJobDtoStatusEnum PROCESSING =
      _$exportJobDtoStatusEnum_PROCESSING;
  @BuiltValueEnumConst(wireName: r'COMPLETED')
  static const ExportJobDtoStatusEnum COMPLETED =
      _$exportJobDtoStatusEnum_COMPLETED;
  @BuiltValueEnumConst(wireName: r'FAILED')
  static const ExportJobDtoStatusEnum FAILED = _$exportJobDtoStatusEnum_FAILED;
  @BuiltValueEnumConst(wireName: r'CANCELLED')
  static const ExportJobDtoStatusEnum CANCELLED =
      _$exportJobDtoStatusEnum_CANCELLED;

  static Serializer<ExportJobDtoStatusEnum> get serializer =>
      _$exportJobDtoStatusEnumSerializer;

  const ExportJobDtoStatusEnum._(String name) : super(name);

  static BuiltSet<ExportJobDtoStatusEnum> get values =>
      _$exportJobDtoStatusEnumValues;
  static ExportJobDtoStatusEnum valueOf(String name) =>
      _$exportJobDtoStatusEnumValueOf(name);
}
