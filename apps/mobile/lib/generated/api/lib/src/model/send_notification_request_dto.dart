//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'send_notification_request_dto.g.dart';

/// SendNotificationRequestDto
///
/// Properties:
/// * [audience]
/// * [userId]
/// * [userIds]
/// * [type]
/// * [title]
/// * [body]
/// * [data]
/// * [scheduledAt] - ISO-8601 datetime. Omit or set to now for immediate delivery.
@BuiltValue()
abstract class SendNotificationRequestDto
    implements
        Built<SendNotificationRequestDto, SendNotificationRequestDtoBuilder> {
  @BuiltValueField(wireName: r'audience')
  SendNotificationRequestDtoAudienceEnum get audience;
  // enum audienceEnum {  USER,  USERS,  ALL,  };

  @BuiltValueField(wireName: r'userId')
  String? get userId;

  @BuiltValueField(wireName: r'userIds')
  BuiltList<String>? get userIds;

  @BuiltValueField(wireName: r'type')
  String get type;

  @BuiltValueField(wireName: r'title')
  String get title;

  @BuiltValueField(wireName: r'body')
  String get body;

  @BuiltValueField(wireName: r'data')
  BuiltMap<String, JsonObject?>? get data;

  /// ISO-8601 datetime. Omit or set to now for immediate delivery.
  @BuiltValueField(wireName: r'scheduledAt')
  String? get scheduledAt;

  SendNotificationRequestDto._();

  factory SendNotificationRequestDto(
          [void updates(SendNotificationRequestDtoBuilder b)]) =
      _$SendNotificationRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SendNotificationRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SendNotificationRequestDto> get serializer =>
      _$SendNotificationRequestDtoSerializer();
}

class _$SendNotificationRequestDtoSerializer
    implements PrimitiveSerializer<SendNotificationRequestDto> {
  @override
  final Iterable<Type> types = const [
    SendNotificationRequestDto,
    _$SendNotificationRequestDto
  ];

  @override
  final String wireName = r'SendNotificationRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SendNotificationRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'audience';
    yield serializers.serialize(
      object.audience,
      specifiedType: const FullType(SendNotificationRequestDtoAudienceEnum),
    );
    if (object.userId != null) {
      yield r'userId';
      yield serializers.serialize(
        object.userId,
        specifiedType: const FullType(String),
      );
    }
    if (object.userIds != null) {
      yield r'userIds';
      yield serializers.serialize(
        object.userIds,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(String),
    );
    yield r'title';
    yield serializers.serialize(
      object.title,
      specifiedType: const FullType(String),
    );
    yield r'body';
    yield serializers.serialize(
      object.body,
      specifiedType: const FullType(String),
    );
    if (object.data != null) {
      yield r'data';
      yield serializers.serialize(
        object.data,
        specifiedType: const FullType(
            BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
      );
    }
    if (object.scheduledAt != null) {
      yield r'scheduledAt';
      yield serializers.serialize(
        object.scheduledAt,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    SendNotificationRequestDto object, {
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
    required SendNotificationRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'audience':
          final valueDes = serializers.deserialize(
            value,
            specifiedType:
                const FullType(SendNotificationRequestDtoAudienceEnum),
          ) as SendNotificationRequestDtoAudienceEnum;
          result.audience = valueDes;
          break;
        case r'userId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.userId = valueDes;
          break;
        case r'userIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.userIds.replace(valueDes);
          break;
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.type = valueDes;
          break;
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.title = valueDes;
          break;
        case r'body':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.body = valueDes;
          break;
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(
                BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
          ) as BuiltMap<String, JsonObject?>;
          result.data.replace(valueDes);
          break;
        case r'scheduledAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.scheduledAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SendNotificationRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SendNotificationRequestDtoBuilder();
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

class SendNotificationRequestDtoAudienceEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'USER')
  static const SendNotificationRequestDtoAudienceEnum USER =
      _$sendNotificationRequestDtoAudienceEnum_USER;
  @BuiltValueEnumConst(wireName: r'USERS')
  static const SendNotificationRequestDtoAudienceEnum USERS =
      _$sendNotificationRequestDtoAudienceEnum_USERS;
  @BuiltValueEnumConst(wireName: r'ALL')
  static const SendNotificationRequestDtoAudienceEnum ALL =
      _$sendNotificationRequestDtoAudienceEnum_ALL;

  static Serializer<SendNotificationRequestDtoAudienceEnum> get serializer =>
      _$sendNotificationRequestDtoAudienceEnumSerializer;

  const SendNotificationRequestDtoAudienceEnum._(String name) : super(name);

  static BuiltSet<SendNotificationRequestDtoAudienceEnum> get values =>
      _$sendNotificationRequestDtoAudienceEnumValues;
  static SendNotificationRequestDtoAudienceEnum valueOf(String name) =>
      _$sendNotificationRequestDtoAudienceEnumValueOf(name);
}
