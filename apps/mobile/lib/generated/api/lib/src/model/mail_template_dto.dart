//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'mail_template_dto.g.dart';

/// MailTemplateDto
///
/// Properties:
/// * [key]
/// * [mandatory]
/// * [sendable] - Whether this template can be sent ad hoc via POST /admin/mail/send.
/// * [variables]
@BuiltValue()
abstract class MailTemplateDto
    implements Built<MailTemplateDto, MailTemplateDtoBuilder> {
  @BuiltValueField(wireName: r'key')
  String get key;

  @BuiltValueField(wireName: r'mandatory')
  bool get mandatory;

  /// Whether this template can be sent ad hoc via POST /admin/mail/send.
  @BuiltValueField(wireName: r'sendable')
  bool get sendable;

  @BuiltValueField(wireName: r'variables')
  BuiltList<String> get variables;

  MailTemplateDto._();

  factory MailTemplateDto([void updates(MailTemplateDtoBuilder b)]) =
      _$MailTemplateDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MailTemplateDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MailTemplateDto> get serializer =>
      _$MailTemplateDtoSerializer();
}

class _$MailTemplateDtoSerializer
    implements PrimitiveSerializer<MailTemplateDto> {
  @override
  final Iterable<Type> types = const [MailTemplateDto, _$MailTemplateDto];

  @override
  final String wireName = r'MailTemplateDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MailTemplateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'key';
    yield serializers.serialize(
      object.key,
      specifiedType: const FullType(String),
    );
    yield r'mandatory';
    yield serializers.serialize(
      object.mandatory,
      specifiedType: const FullType(bool),
    );
    yield r'sendable';
    yield serializers.serialize(
      object.sendable,
      specifiedType: const FullType(bool),
    );
    yield r'variables';
    yield serializers.serialize(
      object.variables,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MailTemplateDto object, {
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
    required MailTemplateDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'key':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.key = valueDes;
          break;
        case r'mandatory':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.mandatory = valueDes;
          break;
        case r'sendable':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.sendable = valueDes;
          break;
        case r'variables':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [
              FullType(String),
            ]),
          ) as BuiltList<String>;
          result.variables.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MailTemplateDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MailTemplateDtoBuilder();
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
