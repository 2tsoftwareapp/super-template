// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'organization_management_controller_create200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$OrganizationManagementControllerCreate200Response
    extends OrganizationManagementControllerCreate200Response {
  @override
  final OrganizationDto data;
  @override
  final RequestMetaDto meta;

  factory _$OrganizationManagementControllerCreate200Response([
    void Function(OrganizationManagementControllerCreate200ResponseBuilder)?
        updates,
  ]) =>
      (OrganizationManagementControllerCreate200ResponseBuilder()
            ..update(updates))
          ._build();

  _$OrganizationManagementControllerCreate200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  OrganizationManagementControllerCreate200Response rebuild(
    void Function(OrganizationManagementControllerCreate200ResponseBuilder)
        updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  OrganizationManagementControllerCreate200ResponseBuilder toBuilder() =>
      OrganizationManagementControllerCreate200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is OrganizationManagementControllerCreate200Response &&
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
      r'OrganizationManagementControllerCreate200Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class OrganizationManagementControllerCreate200ResponseBuilder
    implements
        Builder<OrganizationManagementControllerCreate200Response,
            OrganizationManagementControllerCreate200ResponseBuilder> {
  _$OrganizationManagementControllerCreate200Response? _$v;

  OrganizationDtoBuilder? _data;
  OrganizationDtoBuilder get data => _$this._data ??= OrganizationDtoBuilder();
  set data(OrganizationDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  OrganizationManagementControllerCreate200ResponseBuilder() {
    OrganizationManagementControllerCreate200Response._defaults(this);
  }

  OrganizationManagementControllerCreate200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(OrganizationManagementControllerCreate200Response other) {
    _$v = other as _$OrganizationManagementControllerCreate200Response;
  }

  @override
  void update(
    void Function(OrganizationManagementControllerCreate200ResponseBuilder)?
        updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  OrganizationManagementControllerCreate200Response build() => _build();

  _$OrganizationManagementControllerCreate200Response _build() {
    _$OrganizationManagementControllerCreate200Response _$result;
    try {
      _$result = _$v ??
          _$OrganizationManagementControllerCreate200Response._(
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
          r'OrganizationManagementControllerCreate200Response',
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
