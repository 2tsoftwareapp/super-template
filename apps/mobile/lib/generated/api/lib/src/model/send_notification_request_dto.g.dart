// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'send_notification_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const SendNotificationRequestDtoAudienceEnum
    _$sendNotificationRequestDtoAudienceEnum_USER =
    const SendNotificationRequestDtoAudienceEnum._('USER');
const SendNotificationRequestDtoAudienceEnum
    _$sendNotificationRequestDtoAudienceEnum_USERS =
    const SendNotificationRequestDtoAudienceEnum._('USERS');
const SendNotificationRequestDtoAudienceEnum
    _$sendNotificationRequestDtoAudienceEnum_ALL =
    const SendNotificationRequestDtoAudienceEnum._('ALL');

SendNotificationRequestDtoAudienceEnum
    _$sendNotificationRequestDtoAudienceEnumValueOf(String name) {
  switch (name) {
    case 'USER':
      return _$sendNotificationRequestDtoAudienceEnum_USER;
    case 'USERS':
      return _$sendNotificationRequestDtoAudienceEnum_USERS;
    case 'ALL':
      return _$sendNotificationRequestDtoAudienceEnum_ALL;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<SendNotificationRequestDtoAudienceEnum>
    _$sendNotificationRequestDtoAudienceEnumValues =
    BuiltSet<SendNotificationRequestDtoAudienceEnum>(
  const <SendNotificationRequestDtoAudienceEnum>[
    _$sendNotificationRequestDtoAudienceEnum_USER,
    _$sendNotificationRequestDtoAudienceEnum_USERS,
    _$sendNotificationRequestDtoAudienceEnum_ALL,
  ],
);

Serializer<SendNotificationRequestDtoAudienceEnum>
    _$sendNotificationRequestDtoAudienceEnumSerializer =
    _$SendNotificationRequestDtoAudienceEnumSerializer();

class _$SendNotificationRequestDtoAudienceEnumSerializer
    implements PrimitiveSerializer<SendNotificationRequestDtoAudienceEnum> {
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
  final Iterable<Type> types = const <Type>[
    SendNotificationRequestDtoAudienceEnum,
  ];
  @override
  final String wireName = 'SendNotificationRequestDtoAudienceEnum';

  @override
  Object serialize(
    Serializers serializers,
    SendNotificationRequestDtoAudienceEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  SendNotificationRequestDtoAudienceEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      SendNotificationRequestDtoAudienceEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$SendNotificationRequestDto extends SendNotificationRequestDto {
  @override
  final SendNotificationRequestDtoAudienceEnum audience;
  @override
  final String body;
  @override
  final BuiltMap<String, JsonObject?>? data;
  @override
  final String? idempotencyKey;
  @override
  final String? scheduledAt;
  @override
  final String title;
  @override
  final String type;
  @override
  final String? userId;
  @override
  final BuiltList<String>? userIds;

  factory _$SendNotificationRequestDto([
    void Function(SendNotificationRequestDtoBuilder)? updates,
  ]) =>
      (SendNotificationRequestDtoBuilder()..update(updates))._build();

  _$SendNotificationRequestDto._({
    required this.audience,
    required this.body,
    this.data,
    this.idempotencyKey,
    this.scheduledAt,
    required this.title,
    required this.type,
    this.userId,
    this.userIds,
  }) : super._();
  @override
  SendNotificationRequestDto rebuild(
    void Function(SendNotificationRequestDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  SendNotificationRequestDtoBuilder toBuilder() =>
      SendNotificationRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SendNotificationRequestDto &&
        audience == other.audience &&
        body == other.body &&
        data == other.data &&
        idempotencyKey == other.idempotencyKey &&
        scheduledAt == other.scheduledAt &&
        title == other.title &&
        type == other.type &&
        userId == other.userId &&
        userIds == other.userIds;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, audience.hashCode);
    _$hash = $jc(_$hash, body.hashCode);
    _$hash = $jc(_$hash, data.hashCode);
    _$hash = $jc(_$hash, idempotencyKey.hashCode);
    _$hash = $jc(_$hash, scheduledAt.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jc(_$hash, userId.hashCode);
    _$hash = $jc(_$hash, userIds.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SendNotificationRequestDto')
          ..add('audience', audience)
          ..add('body', body)
          ..add('data', data)
          ..add('idempotencyKey', idempotencyKey)
          ..add('scheduledAt', scheduledAt)
          ..add('title', title)
          ..add('type', type)
          ..add('userId', userId)
          ..add('userIds', userIds))
        .toString();
  }
}

class SendNotificationRequestDtoBuilder
    implements
        Builder<SendNotificationRequestDto, SendNotificationRequestDtoBuilder> {
  _$SendNotificationRequestDto? _$v;

  SendNotificationRequestDtoAudienceEnum? _audience;
  SendNotificationRequestDtoAudienceEnum? get audience => _$this._audience;
  set audience(SendNotificationRequestDtoAudienceEnum? audience) =>
      _$this._audience = audience;

  String? _body;
  String? get body => _$this._body;
  set body(String? body) => _$this._body = body;

  MapBuilder<String, JsonObject?>? _data;
  MapBuilder<String, JsonObject?> get data =>
      _$this._data ??= MapBuilder<String, JsonObject?>();
  set data(MapBuilder<String, JsonObject?>? data) => _$this._data = data;

  String? _idempotencyKey;
  String? get idempotencyKey => _$this._idempotencyKey;
  set idempotencyKey(String? idempotencyKey) =>
      _$this._idempotencyKey = idempotencyKey;

  String? _scheduledAt;
  String? get scheduledAt => _$this._scheduledAt;
  set scheduledAt(String? scheduledAt) => _$this._scheduledAt = scheduledAt;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _type;
  String? get type => _$this._type;
  set type(String? type) => _$this._type = type;

  String? _userId;
  String? get userId => _$this._userId;
  set userId(String? userId) => _$this._userId = userId;

  ListBuilder<String>? _userIds;
  ListBuilder<String> get userIds => _$this._userIds ??= ListBuilder<String>();
  set userIds(ListBuilder<String>? userIds) => _$this._userIds = userIds;

  SendNotificationRequestDtoBuilder() {
    SendNotificationRequestDto._defaults(this);
  }

  SendNotificationRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _audience = $v.audience;
      _body = $v.body;
      _data = $v.data?.toBuilder();
      _idempotencyKey = $v.idempotencyKey;
      _scheduledAt = $v.scheduledAt;
      _title = $v.title;
      _type = $v.type;
      _userId = $v.userId;
      _userIds = $v.userIds?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SendNotificationRequestDto other) {
    _$v = other as _$SendNotificationRequestDto;
  }

  @override
  void update(void Function(SendNotificationRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SendNotificationRequestDto build() => _build();

  _$SendNotificationRequestDto _build() {
    _$SendNotificationRequestDto _$result;
    try {
      _$result = _$v ??
          _$SendNotificationRequestDto._(
            audience: BuiltValueNullFieldError.checkNotNull(
              audience,
              r'SendNotificationRequestDto',
              'audience',
            ),
            body: BuiltValueNullFieldError.checkNotNull(
              body,
              r'SendNotificationRequestDto',
              'body',
            ),
            data: _data?.build(),
            idempotencyKey: idempotencyKey,
            scheduledAt: scheduledAt,
            title: BuiltValueNullFieldError.checkNotNull(
              title,
              r'SendNotificationRequestDto',
              'title',
            ),
            type: BuiltValueNullFieldError.checkNotNull(
              type,
              r'SendNotificationRequestDto',
              'type',
            ),
            userId: userId,
            userIds: _userIds?.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        _data?.build();

        _$failedField = 'userIds';
        _userIds?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'SendNotificationRequestDto',
          _$failedField,
          e.toString(),
        );
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
