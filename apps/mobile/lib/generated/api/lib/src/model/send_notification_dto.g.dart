// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'send_notification_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SendNotificationDto extends SendNotificationDto {
  @override
  final String userId;
  @override
  final String type;
  @override
  final String title;
  @override
  final String body;

  factory _$SendNotificationDto(
          [void Function(SendNotificationDtoBuilder)? updates]) =>
      (SendNotificationDtoBuilder()..update(updates))._build();

  _$SendNotificationDto._(
      {required this.userId,
      required this.type,
      required this.title,
      required this.body})
      : super._();
  @override
  SendNotificationDto rebuild(
          void Function(SendNotificationDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SendNotificationDtoBuilder toBuilder() =>
      SendNotificationDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SendNotificationDto &&
        userId == other.userId &&
        type == other.type &&
        title == other.title &&
        body == other.body;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, userId.hashCode);
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, body.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SendNotificationDto')
          ..add('userId', userId)
          ..add('type', type)
          ..add('title', title)
          ..add('body', body))
        .toString();
  }
}

class SendNotificationDtoBuilder
    implements Builder<SendNotificationDto, SendNotificationDtoBuilder> {
  _$SendNotificationDto? _$v;

  String? _userId;
  String? get userId => _$this._userId;
  set userId(String? userId) => _$this._userId = userId;

  String? _type;
  String? get type => _$this._type;
  set type(String? type) => _$this._type = type;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _body;
  String? get body => _$this._body;
  set body(String? body) => _$this._body = body;

  SendNotificationDtoBuilder() {
    SendNotificationDto._defaults(this);
  }

  SendNotificationDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _userId = $v.userId;
      _type = $v.type;
      _title = $v.title;
      _body = $v.body;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SendNotificationDto other) {
    _$v = other as _$SendNotificationDto;
  }

  @override
  void update(void Function(SendNotificationDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SendNotificationDto build() => _build();

  _$SendNotificationDto _build() {
    final _$result = _$v ??
        _$SendNotificationDto._(
          userId: BuiltValueNullFieldError.checkNotNull(
              userId, r'SendNotificationDto', 'userId'),
          type: BuiltValueNullFieldError.checkNotNull(
              type, r'SendNotificationDto', 'type'),
          title: BuiltValueNullFieldError.checkNotNull(
              title, r'SendNotificationDto', 'title'),
          body: BuiltValueNullFieldError.checkNotNull(
              body, r'SendNotificationDto', 'body'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
