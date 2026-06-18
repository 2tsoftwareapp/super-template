// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'notifications_controller_register_device201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$NotificationsControllerRegisterDevice201Response
    extends NotificationsControllerRegisterDevice201Response {
  @override
  final DeviceTokenDto data;
  @override
  final RequestMetaDto meta;

  factory _$NotificationsControllerRegisterDevice201Response([
    void Function(NotificationsControllerRegisterDevice201ResponseBuilder)?
        updates,
  ]) =>
      (NotificationsControllerRegisterDevice201ResponseBuilder()
            ..update(updates))
          ._build();

  _$NotificationsControllerRegisterDevice201Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  NotificationsControllerRegisterDevice201Response rebuild(
    void Function(NotificationsControllerRegisterDevice201ResponseBuilder)
        updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  NotificationsControllerRegisterDevice201ResponseBuilder toBuilder() =>
      NotificationsControllerRegisterDevice201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is NotificationsControllerRegisterDevice201Response &&
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
      r'NotificationsControllerRegisterDevice201Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class NotificationsControllerRegisterDevice201ResponseBuilder
    implements
        Builder<NotificationsControllerRegisterDevice201Response,
            NotificationsControllerRegisterDevice201ResponseBuilder> {
  _$NotificationsControllerRegisterDevice201Response? _$v;

  DeviceTokenDtoBuilder? _data;
  DeviceTokenDtoBuilder get data => _$this._data ??= DeviceTokenDtoBuilder();
  set data(DeviceTokenDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  NotificationsControllerRegisterDevice201ResponseBuilder() {
    NotificationsControllerRegisterDevice201Response._defaults(this);
  }

  NotificationsControllerRegisterDevice201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(NotificationsControllerRegisterDevice201Response other) {
    _$v = other as _$NotificationsControllerRegisterDevice201Response;
  }

  @override
  void update(
    void Function(NotificationsControllerRegisterDevice201ResponseBuilder)?
        updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  NotificationsControllerRegisterDevice201Response build() => _build();

  _$NotificationsControllerRegisterDevice201Response _build() {
    _$NotificationsControllerRegisterDevice201Response _$result;
    try {
      _$result = _$v ??
          _$NotificationsControllerRegisterDevice201Response._(
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
          r'NotificationsControllerRegisterDevice201Response',
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
