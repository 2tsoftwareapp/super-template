// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'notification_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$NotificationDto extends NotificationDto {
  @override
  final String body;
  @override
  final String createdAt;
  @override
  final BuiltMap<String, JsonObject?>? data;
  @override
  final String id;
  @override
  final JsonObject? readAt;
  @override
  final String title;
  @override
  final String type;
  @override
  final String userId;

  factory _$NotificationDto([void Function(NotificationDtoBuilder)? updates]) =>
      (NotificationDtoBuilder()..update(updates))._build();

  _$NotificationDto._({
    required this.body,
    required this.createdAt,
    this.data,
    required this.id,
    this.readAt,
    required this.title,
    required this.type,
    required this.userId,
  }) : super._();
  @override
  NotificationDto rebuild(void Function(NotificationDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  NotificationDtoBuilder toBuilder() => NotificationDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is NotificationDto &&
        body == other.body &&
        createdAt == other.createdAt &&
        data == other.data &&
        id == other.id &&
        readAt == other.readAt &&
        title == other.title &&
        type == other.type &&
        userId == other.userId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, body.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, data.hashCode);
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, readAt.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jc(_$hash, userId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'NotificationDto')
          ..add('body', body)
          ..add('createdAt', createdAt)
          ..add('data', data)
          ..add('id', id)
          ..add('readAt', readAt)
          ..add('title', title)
          ..add('type', type)
          ..add('userId', userId))
        .toString();
  }
}

class NotificationDtoBuilder
    implements Builder<NotificationDto, NotificationDtoBuilder> {
  _$NotificationDto? _$v;

  String? _body;
  String? get body => _$this._body;
  set body(String? body) => _$this._body = body;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  MapBuilder<String, JsonObject?>? _data;
  MapBuilder<String, JsonObject?> get data =>
      _$this._data ??= MapBuilder<String, JsonObject?>();
  set data(MapBuilder<String, JsonObject?>? data) => _$this._data = data;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  JsonObject? _readAt;
  JsonObject? get readAt => _$this._readAt;
  set readAt(JsonObject? readAt) => _$this._readAt = readAt;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _type;
  String? get type => _$this._type;
  set type(String? type) => _$this._type = type;

  String? _userId;
  String? get userId => _$this._userId;
  set userId(String? userId) => _$this._userId = userId;

  NotificationDtoBuilder() {
    NotificationDto._defaults(this);
  }

  NotificationDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _body = $v.body;
      _createdAt = $v.createdAt;
      _data = $v.data?.toBuilder();
      _id = $v.id;
      _readAt = $v.readAt;
      _title = $v.title;
      _type = $v.type;
      _userId = $v.userId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(NotificationDto other) {
    _$v = other as _$NotificationDto;
  }

  @override
  void update(void Function(NotificationDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  NotificationDto build() => _build();

  _$NotificationDto _build() {
    _$NotificationDto _$result;
    try {
      _$result = _$v ??
          _$NotificationDto._(
            body: BuiltValueNullFieldError.checkNotNull(
              body,
              r'NotificationDto',
              'body',
            ),
            createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt,
              r'NotificationDto',
              'createdAt',
            ),
            data: _data?.build(),
            id: BuiltValueNullFieldError.checkNotNull(
              id,
              r'NotificationDto',
              'id',
            ),
            readAt: readAt,
            title: BuiltValueNullFieldError.checkNotNull(
              title,
              r'NotificationDto',
              'title',
            ),
            type: BuiltValueNullFieldError.checkNotNull(
              type,
              r'NotificationDto',
              'type',
            ),
            userId: BuiltValueNullFieldError.checkNotNull(
              userId,
              r'NotificationDto',
              'userId',
            ),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        _data?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'NotificationDto',
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
