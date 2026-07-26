//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'file_dto.g.dart';

/// FileDto
///
/// Properties:
/// * [id]
/// * [originalName]
/// * [mimeType]
/// * [sizeBytes]
/// * [checksum]
/// * [latestVersion]
/// * [uploadedById]
/// * [createdAt]
/// * [updatedAt]
@BuiltValue()
abstract class FileDto implements Built<FileDto, FileDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'originalName')
  String get originalName;

  @BuiltValueField(wireName: r'mimeType')
  String get mimeType;

  @BuiltValueField(wireName: r'sizeBytes')
  num get sizeBytes;

  @BuiltValueField(wireName: r'checksum')
  JsonObject? get checksum;

  @BuiltValueField(wireName: r'latestVersion')
  num get latestVersion;

  @BuiltValueField(wireName: r'uploadedById')
  JsonObject? get uploadedById;

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  @BuiltValueField(wireName: r'updatedAt')
  String get updatedAt;

  FileDto._();

  factory FileDto([void updates(FileDtoBuilder b)]) = _$FileDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FileDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FileDto> get serializer => _$FileDtoSerializer();
}

class _$FileDtoSerializer implements PrimitiveSerializer<FileDto> {
  @override
  final Iterable<Type> types = const [FileDto, _$FileDto];

  @override
  final String wireName = r'FileDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FileDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'originalName';
    yield serializers.serialize(
      object.originalName,
      specifiedType: const FullType(String),
    );
    yield r'mimeType';
    yield serializers.serialize(
      object.mimeType,
      specifiedType: const FullType(String),
    );
    yield r'sizeBytes';
    yield serializers.serialize(
      object.sizeBytes,
      specifiedType: const FullType(num),
    );
    if (object.checksum != null) {
      yield r'checksum';
      yield serializers.serialize(
        object.checksum,
        specifiedType: const FullType.nullable(JsonObject),
      );
    }
    yield r'latestVersion';
    yield serializers.serialize(
      object.latestVersion,
      specifiedType: const FullType(num),
    );
    yield r'uploadedById';
    yield object.uploadedById == null
        ? null
        : serializers.serialize(
            object.uploadedById,
            specifiedType: const FullType.nullable(JsonObject),
          );
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
    FileDto object, {
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
    required FileDtoBuilder result,
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
        case r'originalName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.originalName = valueDes;
          break;
        case r'mimeType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.mimeType = valueDes;
          break;
        case r'sizeBytes':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(num)) as num;
          result.sizeBytes = valueDes;
          break;
        case r'checksum':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(JsonObject),
          ) as JsonObject?;
          if (valueDes == null) continue;
          result.checksum = valueDes;
          break;
        case r'latestVersion':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(num)) as num;
          result.latestVersion = valueDes;
          break;
        case r'uploadedById':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(JsonObject),
          ) as JsonObject?;
          if (valueDes == null) continue;
          result.uploadedById = valueDes;
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
  FileDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FileDtoBuilder();
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
