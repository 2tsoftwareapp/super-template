//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'mail_delivery_dto.g.dart';

/// MailDeliveryDto
///
/// Properties:
/// * [id]
/// * [templateKey]
/// * [recipient]
/// * [subject]
/// * [status]
/// * [errorMessage]
/// * [metadata]
/// * [sentAt]
/// * [createdAt]
@BuiltValue()
abstract class MailDeliveryDto
    implements Built<MailDeliveryDto, MailDeliveryDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'templateKey')
  String get templateKey;

  @BuiltValueField(wireName: r'recipient')
  String get recipient;

  @BuiltValueField(wireName: r'subject')
  String get subject;

  @BuiltValueField(wireName: r'status')
  MailDeliveryDtoStatusEnum get status;
  // enum statusEnum {  SENT,  FAILED,  };

  @BuiltValueField(wireName: r'errorMessage')
  JsonObject? get errorMessage;

  @BuiltValueField(wireName: r'metadata')
  BuiltMap<String, JsonObject?>? get metadata;

  @BuiltValueField(wireName: r'sentAt')
  JsonObject? get sentAt;

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  MailDeliveryDto._();

  factory MailDeliveryDto([void updates(MailDeliveryDtoBuilder b)]) =
      _$MailDeliveryDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MailDeliveryDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MailDeliveryDto> get serializer =>
      _$MailDeliveryDtoSerializer();
}

class _$MailDeliveryDtoSerializer
    implements PrimitiveSerializer<MailDeliveryDto> {
  @override
  final Iterable<Type> types = const [MailDeliveryDto, _$MailDeliveryDto];

  @override
  final String wireName = r'MailDeliveryDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MailDeliveryDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'templateKey';
    yield serializers.serialize(
      object.templateKey,
      specifiedType: const FullType(String),
    );
    yield r'recipient';
    yield serializers.serialize(
      object.recipient,
      specifiedType: const FullType(String),
    );
    yield r'subject';
    yield serializers.serialize(
      object.subject,
      specifiedType: const FullType(String),
    );
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(MailDeliveryDtoStatusEnum),
    );
    if (object.errorMessage != null) {
      yield r'errorMessage';
      yield serializers.serialize(
        object.errorMessage,
        specifiedType: const FullType(JsonObject),
      );
    }
    if (object.metadata != null) {
      yield r'metadata';
      yield serializers.serialize(
        object.metadata,
        specifiedType: const FullType(
            BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
      );
    }
    if (object.sentAt != null) {
      yield r'sentAt';
      yield serializers.serialize(
        object.sentAt,
        specifiedType: const FullType(JsonObject),
      );
    }
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MailDeliveryDto object, {
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
    required MailDeliveryDtoBuilder result,
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
        case r'templateKey':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.templateKey = valueDes;
          break;
        case r'recipient':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.recipient = valueDes;
          break;
        case r'subject':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.subject = valueDes;
          break;
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MailDeliveryDtoStatusEnum),
          ) as MailDeliveryDtoStatusEnum;
          result.status = valueDes;
          break;
        case r'errorMessage':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.errorMessage = valueDes;
          break;
        case r'metadata':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(
                BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
          ) as BuiltMap<String, JsonObject?>;
          result.metadata.replace(valueDes);
          break;
        case r'sentAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.sentAt = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MailDeliveryDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MailDeliveryDtoBuilder();
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

class MailDeliveryDtoStatusEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'SENT')
  static const MailDeliveryDtoStatusEnum SENT =
      _$mailDeliveryDtoStatusEnum_SENT;
  @BuiltValueEnumConst(wireName: r'FAILED')
  static const MailDeliveryDtoStatusEnum FAILED =
      _$mailDeliveryDtoStatusEnum_FAILED;

  static Serializer<MailDeliveryDtoStatusEnum> get serializer =>
      _$mailDeliveryDtoStatusEnumSerializer;

  const MailDeliveryDtoStatusEnum._(String name) : super(name);

  static BuiltSet<MailDeliveryDtoStatusEnum> get values =>
      _$mailDeliveryDtoStatusEnumValues;
  static MailDeliveryDtoStatusEnum valueOf(String name) =>
      _$mailDeliveryDtoStatusEnumValueOf(name);
}
