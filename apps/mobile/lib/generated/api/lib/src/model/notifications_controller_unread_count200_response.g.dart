// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'notifications_controller_unread_count200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$NotificationsControllerUnreadCount200Response
    extends NotificationsControllerUnreadCount200Response {
  @override
  final CountDto data;
  @override
  final RequestMetaDto meta;

  factory _$NotificationsControllerUnreadCount200Response(
          [void Function(NotificationsControllerUnreadCount200ResponseBuilder)?
              updates]) =>
      (NotificationsControllerUnreadCount200ResponseBuilder()..update(updates))
          ._build();

  _$NotificationsControllerUnreadCount200Response._(
      {required this.data, required this.meta})
      : super._();
  @override
  NotificationsControllerUnreadCount200Response rebuild(
          void Function(NotificationsControllerUnreadCount200ResponseBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  NotificationsControllerUnreadCount200ResponseBuilder toBuilder() =>
      NotificationsControllerUnreadCount200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is NotificationsControllerUnreadCount200Response &&
        data == other.data &&
        meta == other.meta;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, data.hashCode);
    _$hash = $jc(_$hash, meta.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'NotificationsControllerUnreadCount200Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class NotificationsControllerUnreadCount200ResponseBuilder
    implements
        Builder<NotificationsControllerUnreadCount200Response,
            NotificationsControllerUnreadCount200ResponseBuilder> {
  _$NotificationsControllerUnreadCount200Response? _$v;

  CountDtoBuilder? _data;
  CountDtoBuilder get data => _$this._data ??= CountDtoBuilder();
  set data(CountDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  NotificationsControllerUnreadCount200ResponseBuilder() {
    NotificationsControllerUnreadCount200Response._defaults(this);
  }

  NotificationsControllerUnreadCount200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(NotificationsControllerUnreadCount200Response other) {
    _$v = other as _$NotificationsControllerUnreadCount200Response;
  }

  @override
  void update(
      void Function(NotificationsControllerUnreadCount200ResponseBuilder)?
          updates) {
    if (updates != null) updates(this);
  }

  @override
  NotificationsControllerUnreadCount200Response build() => _build();

  _$NotificationsControllerUnreadCount200Response _build() {
    _$NotificationsControllerUnreadCount200Response _$result;
    try {
      _$result = _$v ??
          _$NotificationsControllerUnreadCount200Response._(
            data: data.build(),
            meta: meta.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
        _$failedField = 'meta';
        meta.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'NotificationsControllerUnreadCount200Response',
            _$failedField,
            e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
