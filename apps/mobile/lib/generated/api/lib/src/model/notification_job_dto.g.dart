// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'notification_job_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const NotificationJobDtoAudienceEnum _$notificationJobDtoAudienceEnum_USER =
    const NotificationJobDtoAudienceEnum._('USER');
const NotificationJobDtoAudienceEnum _$notificationJobDtoAudienceEnum_USERS =
    const NotificationJobDtoAudienceEnum._('USERS');
const NotificationJobDtoAudienceEnum _$notificationJobDtoAudienceEnum_ALL =
    const NotificationJobDtoAudienceEnum._('ALL');

NotificationJobDtoAudienceEnum _$notificationJobDtoAudienceEnumValueOf(
    String name) {
  switch (name) {
    case 'USER':
      return _$notificationJobDtoAudienceEnum_USER;
    case 'USERS':
      return _$notificationJobDtoAudienceEnum_USERS;
    case 'ALL':
      return _$notificationJobDtoAudienceEnum_ALL;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<NotificationJobDtoAudienceEnum>
    _$notificationJobDtoAudienceEnumValues = BuiltSet<
        NotificationJobDtoAudienceEnum>(const <NotificationJobDtoAudienceEnum>[
  _$notificationJobDtoAudienceEnum_USER,
  _$notificationJobDtoAudienceEnum_USERS,
  _$notificationJobDtoAudienceEnum_ALL,
]);

const NotificationJobDtoStatusEnum _$notificationJobDtoStatusEnum_PENDING =
    const NotificationJobDtoStatusEnum._('PENDING');
const NotificationJobDtoStatusEnum _$notificationJobDtoStatusEnum_PROCESSING =
    const NotificationJobDtoStatusEnum._('PROCESSING');
const NotificationJobDtoStatusEnum _$notificationJobDtoStatusEnum_COMPLETED =
    const NotificationJobDtoStatusEnum._('COMPLETED');
const NotificationJobDtoStatusEnum _$notificationJobDtoStatusEnum_CANCELLED =
    const NotificationJobDtoStatusEnum._('CANCELLED');
const NotificationJobDtoStatusEnum _$notificationJobDtoStatusEnum_FAILED =
    const NotificationJobDtoStatusEnum._('FAILED');

NotificationJobDtoStatusEnum _$notificationJobDtoStatusEnumValueOf(
    String name) {
  switch (name) {
    case 'PENDING':
      return _$notificationJobDtoStatusEnum_PENDING;
    case 'PROCESSING':
      return _$notificationJobDtoStatusEnum_PROCESSING;
    case 'COMPLETED':
      return _$notificationJobDtoStatusEnum_COMPLETED;
    case 'CANCELLED':
      return _$notificationJobDtoStatusEnum_CANCELLED;
    case 'FAILED':
      return _$notificationJobDtoStatusEnum_FAILED;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<NotificationJobDtoStatusEnum>
    _$notificationJobDtoStatusEnumValues =
    BuiltSet<NotificationJobDtoStatusEnum>(const <NotificationJobDtoStatusEnum>[
  _$notificationJobDtoStatusEnum_PENDING,
  _$notificationJobDtoStatusEnum_PROCESSING,
  _$notificationJobDtoStatusEnum_COMPLETED,
  _$notificationJobDtoStatusEnum_CANCELLED,
  _$notificationJobDtoStatusEnum_FAILED,
]);

Serializer<NotificationJobDtoAudienceEnum>
    _$notificationJobDtoAudienceEnumSerializer =
    _$NotificationJobDtoAudienceEnumSerializer();
Serializer<NotificationJobDtoStatusEnum>
    _$notificationJobDtoStatusEnumSerializer =
    _$NotificationJobDtoStatusEnumSerializer();

class _$NotificationJobDtoAudienceEnumSerializer
    implements PrimitiveSerializer<NotificationJobDtoAudienceEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'USER': 'USER',
    'USERS': 'USERS',
    'ALL': 'ALL',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'USER': 'USER',
    'USERS': 'USERS',
    'ALL': 'ALL',
  };

  @override
  final Iterable<Type> types = const <Type>[NotificationJobDtoAudienceEnum];
  @override
  final String wireName = 'NotificationJobDtoAudienceEnum';

  @override
  Object serialize(
          Serializers serializers, NotificationJobDtoAudienceEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  NotificationJobDtoAudienceEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      NotificationJobDtoAudienceEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$NotificationJobDtoStatusEnumSerializer
    implements PrimitiveSerializer<NotificationJobDtoStatusEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'PENDING': 'PENDING',
    'PROCESSING': 'PROCESSING',
    'COMPLETED': 'COMPLETED',
    'CANCELLED': 'CANCELLED',
    'FAILED': 'FAILED',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'PENDING': 'PENDING',
    'PROCESSING': 'PROCESSING',
    'COMPLETED': 'COMPLETED',
    'CANCELLED': 'CANCELLED',
    'FAILED': 'FAILED',
  };

  @override
  final Iterable<Type> types = const <Type>[NotificationJobDtoStatusEnum];
  @override
  final String wireName = 'NotificationJobDtoStatusEnum';

  @override
  Object serialize(Serializers serializers, NotificationJobDtoStatusEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  NotificationJobDtoStatusEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      NotificationJobDtoStatusEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$NotificationJobDto extends NotificationJobDto {
  @override
  final String id;
  @override
  final String? actorId;
  @override
  final NotificationJobDtoAudienceEnum audience;
  @override
  final String? targetUserId;
  @override
  final BuiltList<String>? userIds;
  @override
  final String type;
  @override
  final String title;
  @override
  final String body;
  @override
  final BuiltMap<String, JsonObject?>? data;
  @override
  final String scheduledAt;
  @override
  final NotificationJobDtoStatusEnum status;
  @override
  final JsonObject? recipientCount;
  @override
  final JsonObject? processedAt;
  @override
  final JsonObject? errorMessage;
  @override
  final String createdAt;
  @override
  final String updatedAt;

  factory _$NotificationJobDto(
          [void Function(NotificationJobDtoBuilder)? updates]) =>
      (NotificationJobDtoBuilder()..update(updates))._build();

  _$NotificationJobDto._(
      {required this.id,
      this.actorId,
      required this.audience,
      this.targetUserId,
      this.userIds,
      required this.type,
      required this.title,
      required this.body,
      this.data,
      required this.scheduledAt,
      required this.status,
      this.recipientCount,
      this.processedAt,
      this.errorMessage,
      required this.createdAt,
      required this.updatedAt})
      : super._();
  @override
  NotificationJobDto rebuild(
          void Function(NotificationJobDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  NotificationJobDtoBuilder toBuilder() =>
      NotificationJobDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is NotificationJobDto &&
        id == other.id &&
        actorId == other.actorId &&
        audience == other.audience &&
        targetUserId == other.targetUserId &&
        userIds == other.userIds &&
        type == other.type &&
        title == other.title &&
        body == other.body &&
        data == other.data &&
        scheduledAt == other.scheduledAt &&
        status == other.status &&
        recipientCount == other.recipientCount &&
        processedAt == other.processedAt &&
        errorMessage == other.errorMessage &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, actorId.hashCode);
    _$hash = $jc(_$hash, audience.hashCode);
    _$hash = $jc(_$hash, targetUserId.hashCode);
    _$hash = $jc(_$hash, userIds.hashCode);
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, body.hashCode);
    _$hash = $jc(_$hash, data.hashCode);
    _$hash = $jc(_$hash, scheduledAt.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, recipientCount.hashCode);
    _$hash = $jc(_$hash, processedAt.hashCode);
    _$hash = $jc(_$hash, errorMessage.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'NotificationJobDto')
          ..add('id', id)
          ..add('actorId', actorId)
          ..add('audience', audience)
          ..add('targetUserId', targetUserId)
          ..add('userIds', userIds)
          ..add('type', type)
          ..add('title', title)
          ..add('body', body)
          ..add('data', data)
          ..add('scheduledAt', scheduledAt)
          ..add('status', status)
          ..add('recipientCount', recipientCount)
          ..add('processedAt', processedAt)
          ..add('errorMessage', errorMessage)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class NotificationJobDtoBuilder
    implements Builder<NotificationJobDto, NotificationJobDtoBuilder> {
  _$NotificationJobDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _actorId;
  String? get actorId => _$this._actorId;
  set actorId(String? actorId) => _$this._actorId = actorId;

  NotificationJobDtoAudienceEnum? _audience;
  NotificationJobDtoAudienceEnum? get audience => _$this._audience;
  set audience(NotificationJobDtoAudienceEnum? audience) =>
      _$this._audience = audience;

  String? _targetUserId;
  String? get targetUserId => _$this._targetUserId;
  set targetUserId(String? targetUserId) => _$this._targetUserId = targetUserId;

  ListBuilder<String>? _userIds;
  ListBuilder<String> get userIds => _$this._userIds ??= ListBuilder<String>();
  set userIds(ListBuilder<String>? userIds) => _$this._userIds = userIds;

  String? _type;
  String? get type => _$this._type;
  set type(String? type) => _$this._type = type;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _body;
  String? get body => _$this._body;
  set body(String? body) => _$this._body = body;

  MapBuilder<String, JsonObject?>? _data;
  MapBuilder<String, JsonObject?> get data =>
      _$this._data ??= MapBuilder<String, JsonObject?>();
  set data(MapBuilder<String, JsonObject?>? data) => _$this._data = data;

  String? _scheduledAt;
  String? get scheduledAt => _$this._scheduledAt;
  set scheduledAt(String? scheduledAt) => _$this._scheduledAt = scheduledAt;

  NotificationJobDtoStatusEnum? _status;
  NotificationJobDtoStatusEnum? get status => _$this._status;
  set status(NotificationJobDtoStatusEnum? status) => _$this._status = status;

  JsonObject? _recipientCount;
  JsonObject? get recipientCount => _$this._recipientCount;
  set recipientCount(JsonObject? recipientCount) =>
      _$this._recipientCount = recipientCount;

  JsonObject? _processedAt;
  JsonObject? get processedAt => _$this._processedAt;
  set processedAt(JsonObject? processedAt) => _$this._processedAt = processedAt;

  JsonObject? _errorMessage;
  JsonObject? get errorMessage => _$this._errorMessage;
  set errorMessage(JsonObject? errorMessage) =>
      _$this._errorMessage = errorMessage;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  NotificationJobDtoBuilder() {
    NotificationJobDto._defaults(this);
  }

  NotificationJobDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _actorId = $v.actorId;
      _audience = $v.audience;
      _targetUserId = $v.targetUserId;
      _userIds = $v.userIds?.toBuilder();
      _type = $v.type;
      _title = $v.title;
      _body = $v.body;
      _data = $v.data?.toBuilder();
      _scheduledAt = $v.scheduledAt;
      _status = $v.status;
      _recipientCount = $v.recipientCount;
      _processedAt = $v.processedAt;
      _errorMessage = $v.errorMessage;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(NotificationJobDto other) {
    _$v = other as _$NotificationJobDto;
  }

  @override
  void update(void Function(NotificationJobDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  NotificationJobDto build() => _build();

  _$NotificationJobDto _build() {
    _$NotificationJobDto _$result;
    try {
      _$result = _$v ??
          _$NotificationJobDto._(
            id: BuiltValueNullFieldError.checkNotNull(
                id, r'NotificationJobDto', 'id'),
            actorId: actorId,
            audience: BuiltValueNullFieldError.checkNotNull(
                audience, r'NotificationJobDto', 'audience'),
            targetUserId: targetUserId,
            userIds: _userIds?.build(),
            type: BuiltValueNullFieldError.checkNotNull(
                type, r'NotificationJobDto', 'type'),
            title: BuiltValueNullFieldError.checkNotNull(
                title, r'NotificationJobDto', 'title'),
            body: BuiltValueNullFieldError.checkNotNull(
                body, r'NotificationJobDto', 'body'),
            data: _data?.build(),
            scheduledAt: BuiltValueNullFieldError.checkNotNull(
                scheduledAt, r'NotificationJobDto', 'scheduledAt'),
            status: BuiltValueNullFieldError.checkNotNull(
                status, r'NotificationJobDto', 'status'),
            recipientCount: recipientCount,
            processedAt: processedAt,
            errorMessage: errorMessage,
            createdAt: BuiltValueNullFieldError.checkNotNull(
                createdAt, r'NotificationJobDto', 'createdAt'),
            updatedAt: BuiltValueNullFieldError.checkNotNull(
                updatedAt, r'NotificationJobDto', 'updatedAt'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'userIds';
        _userIds?.build();

        _$failedField = 'data';
        _data?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'NotificationJobDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
