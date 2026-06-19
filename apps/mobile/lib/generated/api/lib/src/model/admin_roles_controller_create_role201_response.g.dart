// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'admin_roles_controller_create_role201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminRolesControllerCreateRole201Response
    extends AdminRolesControllerCreateRole201Response {
  @override
  final RoleDto data;
  @override
  final RequestMetaDto meta;

  factory _$AdminRolesControllerCreateRole201Response([
    void Function(AdminRolesControllerCreateRole201ResponseBuilder)? updates,
  ]) =>
      (AdminRolesControllerCreateRole201ResponseBuilder()..update(updates))
          ._build();

  _$AdminRolesControllerCreateRole201Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AdminRolesControllerCreateRole201Response rebuild(
    void Function(AdminRolesControllerCreateRole201ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminRolesControllerCreateRole201ResponseBuilder toBuilder() =>
      AdminRolesControllerCreateRole201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminRolesControllerCreateRole201Response &&
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
      r'AdminRolesControllerCreateRole201Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AdminRolesControllerCreateRole201ResponseBuilder
    implements
        Builder<AdminRolesControllerCreateRole201Response,
            AdminRolesControllerCreateRole201ResponseBuilder> {
  _$AdminRolesControllerCreateRole201Response? _$v;

  RoleDtoBuilder? _data;
  RoleDtoBuilder get data => _$this._data ??= RoleDtoBuilder();
  set data(RoleDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AdminRolesControllerCreateRole201ResponseBuilder() {
    AdminRolesControllerCreateRole201Response._defaults(this);
  }

  AdminRolesControllerCreateRole201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminRolesControllerCreateRole201Response other) {
    _$v = other as _$AdminRolesControllerCreateRole201Response;
  }

  @override
  void update(
    void Function(AdminRolesControllerCreateRole201ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AdminRolesControllerCreateRole201Response build() => _build();

  _$AdminRolesControllerCreateRole201Response _build() {
    _$AdminRolesControllerCreateRole201Response _$result;
    try {
      _$result = _$v ??
          _$AdminRolesControllerCreateRole201Response._(
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
          r'AdminRolesControllerCreateRole201Response',
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
