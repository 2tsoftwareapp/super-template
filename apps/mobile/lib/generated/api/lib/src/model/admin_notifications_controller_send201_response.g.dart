// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'admin_notifications_controller_send201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminNotificationsControllerSend201Response
    extends AdminNotificationsControllerSend201Response {
  @override
  final NotificationJobDto data;
  @override
  final RequestMetaDto meta;

  factory _$AdminNotificationsControllerSend201Response(
          [void Function(AdminNotificationsControllerSend201ResponseBuilder)?
              updates]) =>
      (AdminNotificationsControllerSend201ResponseBuilder()..update(updates))
          ._build();

  _$AdminNotificationsControllerSend201Response._(
      {required this.data, required this.meta})
      : super._();
  @override
  AdminNotificationsControllerSend201Response rebuild(
          void Function(AdminNotificationsControllerSend201ResponseBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminNotificationsControllerSend201ResponseBuilder toBuilder() =>
      AdminNotificationsControllerSend201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminNotificationsControllerSend201Response &&
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
            r'AdminNotificationsControllerSend201Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AdminNotificationsControllerSend201ResponseBuilder
    implements
        Builder<AdminNotificationsControllerSend201Response,
            AdminNotificationsControllerSend201ResponseBuilder> {
  _$AdminNotificationsControllerSend201Response? _$v;

  NotificationJobDtoBuilder? _data;
  NotificationJobDtoBuilder get data =>
      _$this._data ??= NotificationJobDtoBuilder();
  set data(NotificationJobDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AdminNotificationsControllerSend201ResponseBuilder() {
    AdminNotificationsControllerSend201Response._defaults(this);
  }

  AdminNotificationsControllerSend201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminNotificationsControllerSend201Response other) {
    _$v = other as _$AdminNotificationsControllerSend201Response;
  }

  @override
  void update(
      void Function(AdminNotificationsControllerSend201ResponseBuilder)?
          updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminNotificationsControllerSend201Response build() => _build();

  _$AdminNotificationsControllerSend201Response _build() {
    _$AdminNotificationsControllerSend201Response _$result;
    try {
      _$result = _$v ??
          _$AdminNotificationsControllerSend201Response._(
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
            r'AdminNotificationsControllerSend201Response',
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
