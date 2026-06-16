// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'admin_users_controller_list_users200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminUsersControllerListUsers200Response
    extends AdminUsersControllerListUsers200Response {
  @override
  final BuiltList<UserDto> data;
  @override
  final PaginationMetaDto meta;

  factory _$AdminUsersControllerListUsers200Response(
          [void Function(AdminUsersControllerListUsers200ResponseBuilder)?
              updates]) =>
      (AdminUsersControllerListUsers200ResponseBuilder()..update(updates))
          ._build();

  _$AdminUsersControllerListUsers200Response._(
      {required this.data, required this.meta})
      : super._();
  @override
  AdminUsersControllerListUsers200Response rebuild(
          void Function(AdminUsersControllerListUsers200ResponseBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminUsersControllerListUsers200ResponseBuilder toBuilder() =>
      AdminUsersControllerListUsers200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminUsersControllerListUsers200Response &&
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
            r'AdminUsersControllerListUsers200Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AdminUsersControllerListUsers200ResponseBuilder
    implements
        Builder<AdminUsersControllerListUsers200Response,
            AdminUsersControllerListUsers200ResponseBuilder> {
  _$AdminUsersControllerListUsers200Response? _$v;

  ListBuilder<UserDto>? _data;
  ListBuilder<UserDto> get data => _$this._data ??= ListBuilder<UserDto>();
  set data(ListBuilder<UserDto>? data) => _$this._data = data;

  PaginationMetaDtoBuilder? _meta;
  PaginationMetaDtoBuilder get meta =>
      _$this._meta ??= PaginationMetaDtoBuilder();
  set meta(PaginationMetaDtoBuilder? meta) => _$this._meta = meta;

  AdminUsersControllerListUsers200ResponseBuilder() {
    AdminUsersControllerListUsers200Response._defaults(this);
  }

  AdminUsersControllerListUsers200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminUsersControllerListUsers200Response other) {
    _$v = other as _$AdminUsersControllerListUsers200Response;
  }

  @override
  void update(
      void Function(AdminUsersControllerListUsers200ResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminUsersControllerListUsers200Response build() => _build();

  _$AdminUsersControllerListUsers200Response _build() {
    _$AdminUsersControllerListUsers200Response _$result;
    try {
      _$result = _$v ??
          _$AdminUsersControllerListUsers200Response._(
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
            r'AdminUsersControllerListUsers200Response',
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
