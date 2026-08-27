//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'file_history_event_dto.g.dart';

/// FileHistoryEventDto
///
/// Properties:
/// * [action]
/// * [actorId]
/// * [createdAt]
/// * [metadata]
/// * [type]
@BuiltValue()
abstract class FileHistoryEventDto
    implements Built<FileHistoryEventDto, FileHistoryEventDtoBuilder> {
  @BuiltValueField(wireName: r'action')
  String get action;

  @BuiltValueField(wireName: r'actorId')
  String? get actorId;

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  @BuiltValueField(wireName: r'metadata')
  BuiltMap<String, JsonObject?>? get metadata;

  @BuiltValueField(wireName: r'type')
  FileHistoryEventDtoTypeEnum get type;
  // enum typeEnum {  version,  audit,  };

  FileHistoryEventDto._();

  factory FileHistoryEventDto([void updates(FileHistoryEventDtoBuilder b)]) =
      _$FileHistoryEventDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FileHistoryEventDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FileHistoryEventDto> get serializer =>
      _$FileHistoryEventDtoSerializer();
}

class _$FileHistoryEventDtoSerializer
    implements PrimitiveSerializer<FileHistoryEventDto> {
  @override
  final Iterable<Type> types = const [
    FileHistoryEventDto,
    _$FileHistoryEventDto,
  ];

  @override
  final String wireName = r'FileHistoryEventDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FileHistoryEventDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'action';
    yield serializers.serialize(
      object.action,
      specifiedType: const FullType(String),
    );
    if (object.actorId != null) {
      yield r'actorId';
      yield serializers.serialize(
        object.actorId,
        specifiedType: const FullType.nullable(String),
      );
    }
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
    );
    if (object.metadata != null) {
      yield r'metadata';
      yield serializers.serialize(
        object.metadata,
        specifiedType: const FullType(BuiltMap, [
          FullType(String),
          FullType.nullable(JsonObject),
        ]),
      );
    }
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(FileHistoryEventDtoTypeEnum),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    FileHistoryEventDto object, {
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
    required FileHistoryEventDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'action':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.action = valueDes;
          break;
        case r'actorId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.actorId = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdAt = valueDes;
          break;
        case r'metadata':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltMap, [
              FullType(String),
              FullType.nullable(JsonObject),
            ]),
          ) as BuiltMap<String, JsonObject?>;
          result.metadata.replace(valueDes);
          break;
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(FileHistoryEventDtoTypeEnum),
          ) as FileHistoryEventDtoTypeEnum;
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
  FileHistoryEventDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FileHistoryEventDtoBuilder();
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

class FileHistoryEventDtoTypeEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'version')
  static const FileHistoryEventDtoTypeEnum version =
      _$fileHistoryEventDtoTypeEnum_version;
  @BuiltValueEnumConst(wireName: r'audit')
  static const FileHistoryEventDtoTypeEnum audit =
      _$fileHistoryEventDtoTypeEnum_audit;

  static Serializer<FileHistoryEventDtoTypeEnum> get serializer =>
      _$fileHistoryEventDtoTypeEnumSerializer;

  const FileHistoryEventDtoTypeEnum._(String name) : super(name);

  static BuiltSet<FileHistoryEventDtoTypeEnum> get values =>
      _$fileHistoryEventDtoTypeEnumValues;
  static FileHistoryEventDtoTypeEnum valueOf(String name) =>
      _$fileHistoryEventDtoTypeEnumValueOf(name);
}
