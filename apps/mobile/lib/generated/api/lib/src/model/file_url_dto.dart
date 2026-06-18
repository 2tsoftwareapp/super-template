//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'file_url_dto.g.dart';

/// FileUrlDto
///
/// Properties:
/// * [id]
/// * [url]
/// * [expiresInSeconds]
@BuiltValue()
abstract class FileUrlDto implements Built<FileUrlDto, FileUrlDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'url')
  String get url;

  @BuiltValueField(wireName: r'expiresInSeconds')
  num get expiresInSeconds;

  FileUrlDto._();

  factory FileUrlDto([void updates(FileUrlDtoBuilder b)]) = _$FileUrlDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FileUrlDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FileUrlDto> get serializer => _$FileUrlDtoSerializer();
}

class _$FileUrlDtoSerializer implements PrimitiveSerializer<FileUrlDto> {
  @override
  final Iterable<Type> types = const [FileUrlDto, _$FileUrlDto];

  @override
  final String wireName = r'FileUrlDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FileUrlDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'url';
    yield serializers.serialize(
      object.url,
      specifiedType: const FullType(String),
    );
    yield r'expiresInSeconds';
    yield serializers.serialize(
      object.expiresInSeconds,
      specifiedType: const FullType(num),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    FileUrlDto object, {
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
    required FileUrlDtoBuilder result,
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
        case r'url':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.url = valueDes;
          break;
        case r'expiresInSeconds':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(num)) as num;
          result.expiresInSeconds = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  FileUrlDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FileUrlDtoBuilder();
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
