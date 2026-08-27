//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'send_admin_mail_dto.g.dart';

/// SendAdminMailDto
///
/// Properties:
/// * [idempotencyKey] - Replaying the same key returns the original job instead of sending again.
/// * [templateKey] - Non-mandatory template key (security templates cannot be sent ad hoc).
/// * [to]
/// * [variables]
@BuiltValue()
abstract class SendAdminMailDto
    implements Built<SendAdminMailDto, SendAdminMailDtoBuilder> {
  /// Replaying the same key returns the original job instead of sending again.
  @BuiltValueField(wireName: r'idempotencyKey')
  String? get idempotencyKey;

  /// Non-mandatory template key (security templates cannot be sent ad hoc).
  @BuiltValueField(wireName: r'templateKey')
  String get templateKey;

  @BuiltValueField(wireName: r'to')
  String get to;

  @BuiltValueField(wireName: r'variables')
  BuiltMap<String, String>? get variables;

  SendAdminMailDto._();

  factory SendAdminMailDto([void updates(SendAdminMailDtoBuilder b)]) =
      _$SendAdminMailDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SendAdminMailDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SendAdminMailDto> get serializer =>
      _$SendAdminMailDtoSerializer();
}

class _$SendAdminMailDtoSerializer
    implements PrimitiveSerializer<SendAdminMailDto> {
  @override
  final Iterable<Type> types = const [SendAdminMailDto, _$SendAdminMailDto];

  @override
  final String wireName = r'SendAdminMailDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SendAdminMailDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.idempotencyKey != null) {
      yield r'idempotencyKey';
      yield serializers.serialize(
        object.idempotencyKey,
        specifiedType: const FullType(String),
      );
    }
    yield r'templateKey';
    yield serializers.serialize(
      object.templateKey,
      specifiedType: const FullType(String),
    );
    yield r'to';
    yield serializers.serialize(
      object.to,
      specifiedType: const FullType(String),
    );
    if (object.variables != null) {
      yield r'variables';
      yield serializers.serialize(
        object.variables,
        specifiedType: const FullType(BuiltMap, [
          FullType(String),
          FullType(String),
        ]),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    SendAdminMailDto object, {
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
    required SendAdminMailDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'idempotencyKey':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.idempotencyKey = valueDes;
          break;
        case r'templateKey':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.templateKey = valueDes;
          break;
        case r'to':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.to = valueDes;
          break;
        case r'variables':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltMap, [
              FullType(String),
              FullType(String),
            ]),
          ) as BuiltMap<String, String>;
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
  SendAdminMailDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SendAdminMailDtoBuilder();
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
