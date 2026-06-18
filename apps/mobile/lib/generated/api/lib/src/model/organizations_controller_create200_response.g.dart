// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'organizations_controller_create200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$OrganizationsControllerCreate200Response
    extends OrganizationsControllerCreate200Response {
  @override
  final OrganizationDto data;
  @override
  final RequestMetaDto meta;

  factory _$OrganizationsControllerCreate200Response([
    void Function(OrganizationsControllerCreate200ResponseBuilder)? updates,
  ]) =>
      (OrganizationsControllerCreate200ResponseBuilder()..update(updates))
          ._build();

  _$OrganizationsControllerCreate200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  OrganizationsControllerCreate200Response rebuild(
    void Function(OrganizationsControllerCreate200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  OrganizationsControllerCreate200ResponseBuilder toBuilder() =>
      OrganizationsControllerCreate200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is OrganizationsControllerCreate200Response &&
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
      r'OrganizationsControllerCreate200Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class OrganizationsControllerCreate200ResponseBuilder
    implements
        Builder<OrganizationsControllerCreate200Response,
            OrganizationsControllerCreate200ResponseBuilder> {
  _$OrganizationsControllerCreate200Response? _$v;

  OrganizationDtoBuilder? _data;
  OrganizationDtoBuilder get data => _$this._data ??= OrganizationDtoBuilder();
  set data(OrganizationDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  OrganizationsControllerCreate200ResponseBuilder() {
    OrganizationsControllerCreate200Response._defaults(this);
  }

  OrganizationsControllerCreate200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(OrganizationsControllerCreate200Response other) {
    _$v = other as _$OrganizationsControllerCreate200Response;
  }

  @override
  void update(
    void Function(OrganizationsControllerCreate200ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  OrganizationsControllerCreate200Response build() => _build();

  _$OrganizationsControllerCreate200Response _build() {
    _$OrganizationsControllerCreate200Response _$result;
    try {
      _$result = _$v ??
          _$OrganizationsControllerCreate200Response._(
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
          r'OrganizationsControllerCreate200Response',
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
