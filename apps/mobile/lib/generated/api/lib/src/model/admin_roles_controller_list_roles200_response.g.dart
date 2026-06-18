// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'admin_roles_controller_list_roles200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminRolesControllerListRoles200Response
    extends AdminRolesControllerListRoles200Response {
  @override
  final BuiltList<RoleDto> data;
  @override
  final RequestMetaDto meta;

  factory _$AdminRolesControllerListRoles200Response([
    void Function(AdminRolesControllerListRoles200ResponseBuilder)? updates,
  ]) =>
      (AdminRolesControllerListRoles200ResponseBuilder()..update(updates))
          ._build();

  _$AdminRolesControllerListRoles200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AdminRolesControllerListRoles200Response rebuild(
    void Function(AdminRolesControllerListRoles200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminRolesControllerListRoles200ResponseBuilder toBuilder() =>
      AdminRolesControllerListRoles200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminRolesControllerListRoles200Response &&
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
      r'AdminRolesControllerListRoles200Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AdminRolesControllerListRoles200ResponseBuilder
    implements
        Builder<AdminRolesControllerListRoles200Response,
            AdminRolesControllerListRoles200ResponseBuilder> {
  _$AdminRolesControllerListRoles200Response? _$v;

  ListBuilder<RoleDto>? _data;
  ListBuilder<RoleDto> get data => _$this._data ??= ListBuilder<RoleDto>();
  set data(ListBuilder<RoleDto>? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AdminRolesControllerListRoles200ResponseBuilder() {
    AdminRolesControllerListRoles200Response._defaults(this);
  }

  AdminRolesControllerListRoles200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminRolesControllerListRoles200Response other) {
    _$v = other as _$AdminRolesControllerListRoles200Response;
  }

  @override
  void update(
    void Function(AdminRolesControllerListRoles200ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AdminRolesControllerListRoles200Response build() => _build();

  _$AdminRolesControllerListRoles200Response _build() {
    _$AdminRolesControllerListRoles200Response _$result;
    try {
      _$result = _$v ??
          _$AdminRolesControllerListRoles200Response._(
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
          r'AdminRolesControllerListRoles200Response',
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
