// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'admin_users_controller_delete_user200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminUsersControllerDeleteUser200Response
    extends AdminUsersControllerDeleteUser200Response {
  @override
  final SuccessFlagDto data;
  @override
  final RequestMetaDto meta;

  factory _$AdminUsersControllerDeleteUser200Response(
          [void Function(AdminUsersControllerDeleteUser200ResponseBuilder)?
              updates]) =>
      (AdminUsersControllerDeleteUser200ResponseBuilder()..update(updates))
          ._build();

  _$AdminUsersControllerDeleteUser200Response._(
      {required this.data, required this.meta})
      : super._();
  @override
  AdminUsersControllerDeleteUser200Response rebuild(
          void Function(AdminUsersControllerDeleteUser200ResponseBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminUsersControllerDeleteUser200ResponseBuilder toBuilder() =>
      AdminUsersControllerDeleteUser200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminUsersControllerDeleteUser200Response &&
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
            r'AdminUsersControllerDeleteUser200Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AdminUsersControllerDeleteUser200ResponseBuilder
    implements
        Builder<AdminUsersControllerDeleteUser200Response,
            AdminUsersControllerDeleteUser200ResponseBuilder> {
  _$AdminUsersControllerDeleteUser200Response? _$v;

  SuccessFlagDtoBuilder? _data;
  SuccessFlagDtoBuilder get data => _$this._data ??= SuccessFlagDtoBuilder();
  set data(SuccessFlagDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AdminUsersControllerDeleteUser200ResponseBuilder() {
    AdminUsersControllerDeleteUser200Response._defaults(this);
  }

  AdminUsersControllerDeleteUser200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminUsersControllerDeleteUser200Response other) {
    _$v = other as _$AdminUsersControllerDeleteUser200Response;
  }

  @override
  void update(
      void Function(AdminUsersControllerDeleteUser200ResponseBuilder)?
          updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminUsersControllerDeleteUser200Response build() => _build();

  _$AdminUsersControllerDeleteUser200Response _build() {
    _$AdminUsersControllerDeleteUser200Response _$result;
    try {
      _$result = _$v ??
          _$AdminUsersControllerDeleteUser200Response._(
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
            r'AdminUsersControllerDeleteUser200Response',
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
