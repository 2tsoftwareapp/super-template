// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'admin_mail_controller_send201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminMailControllerSend201Response
    extends AdminMailControllerSend201Response {
  @override
  final SendAdminMailResultDto data;
  @override
  final RequestMetaDto meta;

  factory _$AdminMailControllerSend201Response([
    void Function(AdminMailControllerSend201ResponseBuilder)? updates,
  ]) =>
      (AdminMailControllerSend201ResponseBuilder()..update(updates))._build();

  _$AdminMailControllerSend201Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AdminMailControllerSend201Response rebuild(
    void Function(AdminMailControllerSend201ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminMailControllerSend201ResponseBuilder toBuilder() =>
      AdminMailControllerSend201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminMailControllerSend201Response &&
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
    return (newBuiltValueToStringHelper(r'AdminMailControllerSend201Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AdminMailControllerSend201ResponseBuilder
    implements
        Builder<AdminMailControllerSend201Response,
            AdminMailControllerSend201ResponseBuilder> {
  _$AdminMailControllerSend201Response? _$v;

  SendAdminMailResultDtoBuilder? _data;
  SendAdminMailResultDtoBuilder get data =>
      _$this._data ??= SendAdminMailResultDtoBuilder();
  set data(SendAdminMailResultDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AdminMailControllerSend201ResponseBuilder() {
    AdminMailControllerSend201Response._defaults(this);
  }

  AdminMailControllerSend201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminMailControllerSend201Response other) {
    _$v = other as _$AdminMailControllerSend201Response;
  }

  @override
  void update(
    void Function(AdminMailControllerSend201ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AdminMailControllerSend201Response build() => _build();

  _$AdminMailControllerSend201Response _build() {
    _$AdminMailControllerSend201Response _$result;
    try {
      _$result = _$v ??
          _$AdminMailControllerSend201Response._(
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
          r'AdminMailControllerSend201Response',
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
