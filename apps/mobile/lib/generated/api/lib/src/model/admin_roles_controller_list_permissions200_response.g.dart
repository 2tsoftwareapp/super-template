// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'admin_roles_controller_list_permissions200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminRolesControllerListPermissions200Response
    extends AdminRolesControllerListPermissions200Response {
  @override
  final BuiltList<PermissionDto> data;
  @override
  final RequestMetaDto meta;

  factory _$AdminRolesControllerListPermissions200Response([
    void Function(AdminRolesControllerListPermissions200ResponseBuilder)?
        updates,
  ]) =>
      (AdminRolesControllerListPermissions200ResponseBuilder()..update(updates))
          ._build();

  _$AdminRolesControllerListPermissions200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AdminRolesControllerListPermissions200Response rebuild(
    void Function(AdminRolesControllerListPermissions200ResponseBuilder)
        updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminRolesControllerListPermissions200ResponseBuilder toBuilder() =>
      AdminRolesControllerListPermissions200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminRolesControllerListPermissions200Response &&
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
      r'AdminRolesControllerListPermissions200Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AdminRolesControllerListPermissions200ResponseBuilder
    implements
        Builder<AdminRolesControllerListPermissions200Response,
            AdminRolesControllerListPermissions200ResponseBuilder> {
  _$AdminRolesControllerListPermissions200Response? _$v;

  ListBuilder<PermissionDto>? _data;
  ListBuilder<PermissionDto> get data =>
      _$this._data ??= ListBuilder<PermissionDto>();
  set data(ListBuilder<PermissionDto>? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AdminRolesControllerListPermissions200ResponseBuilder() {
    AdminRolesControllerListPermissions200Response._defaults(this);
  }

  AdminRolesControllerListPermissions200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminRolesControllerListPermissions200Response other) {
    _$v = other as _$AdminRolesControllerListPermissions200Response;
  }

  @override
  void update(
    void Function(AdminRolesControllerListPermissions200ResponseBuilder)?
        updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AdminRolesControllerListPermissions200Response build() => _build();

  _$AdminRolesControllerListPermissions200Response _build() {
    _$AdminRolesControllerListPermissions200Response _$result;
    try {
      _$result = _$v ??
          _$AdminRolesControllerListPermissions200Response._(
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
          r'AdminRolesControllerListPermissions200Response',
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
