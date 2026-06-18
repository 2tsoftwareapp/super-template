//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'mail_preview_dto.g.dart';

/// MailPreviewDto
///
/// Properties:
/// * [subject]
/// * [text]
/// * [html]
@BuiltValue()
abstract class MailPreviewDto
    implements Built<MailPreviewDto, MailPreviewDtoBuilder> {
  @BuiltValueField(wireName: r'subject')
  String get subject;

  @BuiltValueField(wireName: r'text')
  String get text;

  @BuiltValueField(wireName: r'html')
  String get html;

  MailPreviewDto._();

  factory MailPreviewDto([void updates(MailPreviewDtoBuilder b)]) =
      _$MailPreviewDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MailPreviewDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MailPreviewDto> get serializer =>
      _$MailPreviewDtoSerializer();
}

class _$MailPreviewDtoSerializer
    implements PrimitiveSerializer<MailPreviewDto> {
  @override
  final Iterable<Type> types = const [MailPreviewDto, _$MailPreviewDto];

  @override
  final String wireName = r'MailPreviewDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MailPreviewDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'subject';
    yield serializers.serialize(
      object.subject,
      specifiedType: const FullType(String),
    );
    yield r'text';
    yield serializers.serialize(
      object.text,
      specifiedType: const FullType(String),
    );
    yield r'html';
    yield serializers.serialize(
      object.html,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MailPreviewDto object, {
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
    required MailPreviewDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'subject':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.subject = valueDes;
          break;
        case r'text':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.text = valueDes;
          break;
        case r'html':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.html = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MailPreviewDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MailPreviewDtoBuilder();
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
