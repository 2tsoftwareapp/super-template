//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'notification_job_dto.g.dart';

/// NotificationJobDto
///
/// Properties:
/// * [actorId]
/// * [audience]
/// * [body]
/// * [createdAt]
/// * [data]
/// * [errorMessage]
/// * [id]
/// * [processedAt]
/// * [recipientCount]
/// * [scheduledAt]
/// * [status]
/// * [targetUserId]
/// * [title]
/// * [type]
/// * [updatedAt]
/// * [userIds]
@BuiltValue()
abstract class NotificationJobDto
    implements Built<NotificationJobDto, NotificationJobDtoBuilder> {
  @BuiltValueField(wireName: r'actorId')
  String? get actorId;

  @BuiltValueField(wireName: r'audience')
  NotificationJobDtoAudienceEnum get audience;
  // enum audienceEnum {  USER,  USERS,  ALL,  };

  @BuiltValueField(wireName: r'body')
  String get body;

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  @BuiltValueField(wireName: r'data')
  BuiltMap<String, JsonObject?>? get data;

  @BuiltValueField(wireName: r'errorMessage')
  JsonObject? get errorMessage;

  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'processedAt')
  JsonObject? get processedAt;

  @BuiltValueField(wireName: r'recipientCount')
  JsonObject? get recipientCount;

  @BuiltValueField(wireName: r'scheduledAt')
  String get scheduledAt;

  @BuiltValueField(wireName: r'status')
  NotificationJobDtoStatusEnum get status;
  // enum statusEnum {  PENDING,  PROCESSING,  COMPLETED,  CANCELLED,  FAILED,  };

  @BuiltValueField(wireName: r'targetUserId')
  String? get targetUserId;

  @BuiltValueField(wireName: r'title')
  String get title;

  @BuiltValueField(wireName: r'type')
  String get type;

  @BuiltValueField(wireName: r'updatedAt')
  String get updatedAt;

  @BuiltValueField(wireName: r'userIds')
  BuiltList<String>? get userIds;

  NotificationJobDto._();

  factory NotificationJobDto([void updates(NotificationJobDtoBuilder b)]) =
      _$NotificationJobDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(NotificationJobDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<NotificationJobDto> get serializer =>
      _$NotificationJobDtoSerializer();
}

class _$NotificationJobDtoSerializer
    implements PrimitiveSerializer<NotificationJobDto> {
  @override
  final Iterable<Type> types = const [NotificationJobDto, _$NotificationJobDto];

  @override
  final String wireName = r'NotificationJobDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    NotificationJobDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.actorId != null) {
      yield r'actorId';
      yield serializers.serialize(
        object.actorId,
        specifiedType: const FullType.nullable(String),
      );
    }
    yield r'audience';
    yield serializers.serialize(
      object.audience,
      specifiedType: const FullType(NotificationJobDtoAudienceEnum),
    );
    yield r'body';
    yield serializers.serialize(
      object.body,
      specifiedType: const FullType(String),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
    );
    if (object.data != null) {
      yield r'data';
      yield serializers.serialize(
        object.data,
        specifiedType: const FullType(BuiltMap, [
          FullType(String),
          FullType.nullable(JsonObject),
        ]),
      );
    }
    if (object.errorMessage != null) {
      yield r'errorMessage';
      yield serializers.serialize(
        object.errorMessage,
        specifiedType: const FullType(JsonObject),
      );
    }
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    if (object.processedAt != null) {
      yield r'processedAt';
      yield serializers.serialize(
        object.processedAt,
        specifiedType: const FullType(JsonObject),
      );
    }
    if (object.recipientCount != null) {
      yield r'recipientCount';
      yield serializers.serialize(
        object.recipientCount,
        specifiedType: const FullType(JsonObject),
      );
    }
    yield r'scheduledAt';
    yield serializers.serialize(
      object.scheduledAt,
      specifiedType: const FullType(String),
    );
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(NotificationJobDtoStatusEnum),
    );
    if (object.targetUserId != null) {
      yield r'targetUserId';
      yield serializers.serialize(
        object.targetUserId,
        specifiedType: const FullType.nullable(String),
      );
    }
    yield r'title';
    yield serializers.serialize(
      object.title,
      specifiedType: const FullType(String),
    );
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(String),
    );
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(String),
    );
    if (object.userIds != null) {
      yield r'userIds';
      yield serializers.serialize(
        object.userIds,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    NotificationJobDto object, {
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
    required NotificationJobDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'actorId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.actorId = valueDes;
          break;
        case r'audience':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(
              NotificationJobDtoAudienceEnum,
            ),
          ) as NotificationJobDtoAudienceEnum;
          result.audience = valueDes;
          break;
        case r'body':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.body = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdAt = valueDes;
          break;
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltMap, [
              FullType(String),
              FullType.nullable(JsonObject),
            ]),
          ) as BuiltMap<String, JsonObject?>;
          result.data.replace(valueDes);
          break;
        case r'errorMessage':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.errorMessage = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'processedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.processedAt = valueDes;
          break;
        case r'recipientCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.recipientCount = valueDes;
          break;
        case r'scheduledAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.scheduledAt = valueDes;
          break;
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(NotificationJobDtoStatusEnum),
          ) as NotificationJobDtoStatusEnum;
          result.status = valueDes;
          break;
        case r'targetUserId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.targetUserId = valueDes;
          break;
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.title = valueDes;
          break;
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.type = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.updatedAt = valueDes;
          break;
        case r'userIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [
              FullType(String),
            ]),
          ) as BuiltList<String>;
          result.userIds.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  NotificationJobDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = NotificationJobDtoBuilder();
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

class NotificationJobDtoAudienceEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'USER')
  static const NotificationJobDtoAudienceEnum USER =
      _$notificationJobDtoAudienceEnum_USER;
  @BuiltValueEnumConst(wireName: r'USERS')
  static const NotificationJobDtoAudienceEnum USERS =
      _$notificationJobDtoAudienceEnum_USERS;
  @BuiltValueEnumConst(wireName: r'ALL')
  static const NotificationJobDtoAudienceEnum ALL =
      _$notificationJobDtoAudienceEnum_ALL;

  static Serializer<NotificationJobDtoAudienceEnum> get serializer =>
      _$notificationJobDtoAudienceEnumSerializer;

  const NotificationJobDtoAudienceEnum._(String name) : super(name);

  static BuiltSet<NotificationJobDtoAudienceEnum> get values =>
      _$notificationJobDtoAudienceEnumValues;
  static NotificationJobDtoAudienceEnum valueOf(String name) =>
      _$notificationJobDtoAudienceEnumValueOf(name);
}

class NotificationJobDtoStatusEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'PENDING')
  static const NotificationJobDtoStatusEnum PENDING =
      _$notificationJobDtoStatusEnum_PENDING;
  @BuiltValueEnumConst(wireName: r'PROCESSING')
  static const NotificationJobDtoStatusEnum PROCESSING =
      _$notificationJobDtoStatusEnum_PROCESSING;
  @BuiltValueEnumConst(wireName: r'COMPLETED')
  static const NotificationJobDtoStatusEnum COMPLETED =
      _$notificationJobDtoStatusEnum_COMPLETED;
  @BuiltValueEnumConst(wireName: r'CANCELLED')
  static const NotificationJobDtoStatusEnum CANCELLED =
      _$notificationJobDtoStatusEnum_CANCELLED;
  @BuiltValueEnumConst(wireName: r'FAILED')
  static const NotificationJobDtoStatusEnum FAILED =
      _$notificationJobDtoStatusEnum_FAILED;

  static Serializer<NotificationJobDtoStatusEnum> get serializer =>
      _$notificationJobDtoStatusEnumSerializer;

  const NotificationJobDtoStatusEnum._(String name) : super(name);

  static BuiltSet<NotificationJobDtoStatusEnum> get values =>
      _$notificationJobDtoStatusEnumValues;
  static NotificationJobDtoStatusEnum valueOf(String name) =>
      _$notificationJobDtoStatusEnumValueOf(name);
}
