// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notifications_controller_list200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$NotificationsControllerList200Response
    extends NotificationsControllerList200Response {
  @override
  final BuiltList<NotificationDto> data;
  @override
  final PaginationMetaDto meta;

  factory _$NotificationsControllerList200Response([
    void Function(NotificationsControllerList200ResponseBuilder)? updates,
  ]) => (NotificationsControllerList200ResponseBuilder()..update(updates))
      ._build();

  _$NotificationsControllerList200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  NotificationsControllerList200Response rebuild(
    void Function(NotificationsControllerList200ResponseBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  NotificationsControllerList200ResponseBuilder toBuilder() =>
      NotificationsControllerList200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is NotificationsControllerList200Response &&
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
            r'NotificationsControllerList200Response',
          )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class NotificationsControllerList200ResponseBuilder
    implements
        Builder<
          NotificationsControllerList200Response,
          NotificationsControllerList200ResponseBuilder
        > {
  _$NotificationsControllerList200Response? _$v;

  ListBuilder<NotificationDto>? _data;
  ListBuilder<NotificationDto> get data =>
      _$this._data ??= ListBuilder<NotificationDto>();
  set data(ListBuilder<NotificationDto>? data) => _$this._data = data;

  PaginationMetaDtoBuilder? _meta;
  PaginationMetaDtoBuilder get meta =>
      _$this._meta ??= PaginationMetaDtoBuilder();
  set meta(PaginationMetaDtoBuilder? meta) => _$this._meta = meta;

  NotificationsControllerList200ResponseBuilder() {
    NotificationsControllerList200Response._defaults(this);
  }

  NotificationsControllerList200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(NotificationsControllerList200Response other) {
    _$v = other as _$NotificationsControllerList200Response;
  }

  @override
  void update(
    void Function(NotificationsControllerList200ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  NotificationsControllerList200Response build() => _build();

  _$NotificationsControllerList200Response _build() {
    _$NotificationsControllerList200Response _$result;
    try {
      _$result =
          _$v ??
          _$NotificationsControllerList200Response._(
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
          r'NotificationsControllerList200Response',
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
