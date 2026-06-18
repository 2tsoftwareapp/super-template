// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'notifications_controller_mark_read200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$NotificationsControllerMarkRead200Response
    extends NotificationsControllerMarkRead200Response {
  @override
  final NotificationDto data;
  @override
  final RequestMetaDto meta;

  factory _$NotificationsControllerMarkRead200Response([
    void Function(NotificationsControllerMarkRead200ResponseBuilder)? updates,
  ]) =>
      (NotificationsControllerMarkRead200ResponseBuilder()..update(updates))
          ._build();

  _$NotificationsControllerMarkRead200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  NotificationsControllerMarkRead200Response rebuild(
    void Function(NotificationsControllerMarkRead200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  NotificationsControllerMarkRead200ResponseBuilder toBuilder() =>
      NotificationsControllerMarkRead200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is NotificationsControllerMarkRead200Response &&
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
      r'NotificationsControllerMarkRead200Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class NotificationsControllerMarkRead200ResponseBuilder
    implements
        Builder<NotificationsControllerMarkRead200Response,
            NotificationsControllerMarkRead200ResponseBuilder> {
  _$NotificationsControllerMarkRead200Response? _$v;

  NotificationDtoBuilder? _data;
  NotificationDtoBuilder get data => _$this._data ??= NotificationDtoBuilder();
  set data(NotificationDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  NotificationsControllerMarkRead200ResponseBuilder() {
    NotificationsControllerMarkRead200Response._defaults(this);
  }

  NotificationsControllerMarkRead200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(NotificationsControllerMarkRead200Response other) {
    _$v = other as _$NotificationsControllerMarkRead200Response;
  }

  @override
  void update(
    void Function(NotificationsControllerMarkRead200ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  NotificationsControllerMarkRead200Response build() => _build();

  _$NotificationsControllerMarkRead200Response _build() {
    _$NotificationsControllerMarkRead200Response _$result;
    try {
      _$result = _$v ??
          _$NotificationsControllerMarkRead200Response._(
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
          r'NotificationsControllerMarkRead200Response',
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
