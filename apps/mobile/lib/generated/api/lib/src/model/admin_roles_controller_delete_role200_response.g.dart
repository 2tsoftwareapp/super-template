// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'admin_roles_controller_delete_role200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminRolesControllerDeleteRole200Response
    extends AdminRolesControllerDeleteRole200Response {
  @override
  final SuccessFlagDto data;
  @override
  final RequestMetaDto meta;

  factory _$AdminRolesControllerDeleteRole200Response([
    void Function(AdminRolesControllerDeleteRole200ResponseBuilder)? updates,
  ]) =>
      (AdminRolesControllerDeleteRole200ResponseBuilder()..update(updates))
          ._build();

  _$AdminRolesControllerDeleteRole200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AdminRolesControllerDeleteRole200Response rebuild(
    void Function(AdminRolesControllerDeleteRole200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminRolesControllerDeleteRole200ResponseBuilder toBuilder() =>
      AdminRolesControllerDeleteRole200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminRolesControllerDeleteRole200Response &&
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
      r'AdminRolesControllerDeleteRole200Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AdminRolesControllerDeleteRole200ResponseBuilder
    implements
        Builder<AdminRolesControllerDeleteRole200Response,
            AdminRolesControllerDeleteRole200ResponseBuilder> {
  _$AdminRolesControllerDeleteRole200Response? _$v;

  SuccessFlagDtoBuilder? _data;
  SuccessFlagDtoBuilder get data => _$this._data ??= SuccessFlagDtoBuilder();
  set data(SuccessFlagDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AdminRolesControllerDeleteRole200ResponseBuilder() {
    AdminRolesControllerDeleteRole200Response._defaults(this);
  }

  AdminRolesControllerDeleteRole200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminRolesControllerDeleteRole200Response other) {
    _$v = other as _$AdminRolesControllerDeleteRole200Response;
  }

  @override
  void update(
    void Function(AdminRolesControllerDeleteRole200ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AdminRolesControllerDeleteRole200Response build() => _build();

  _$AdminRolesControllerDeleteRole200Response _build() {
    _$AdminRolesControllerDeleteRole200Response _$result;
    try {
      _$result = _$v ??
          _$AdminRolesControllerDeleteRole200Response._(
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
          r'AdminRolesControllerDeleteRole200Response',
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
