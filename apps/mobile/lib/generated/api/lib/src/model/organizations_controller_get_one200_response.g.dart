// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'organizations_controller_get_one200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$OrganizationsControllerGetOne200Response
    extends OrganizationsControllerGetOne200Response {
  @override
  final OrganizationDetailDto data;
  @override
  final RequestMetaDto meta;

  factory _$OrganizationsControllerGetOne200Response([
    void Function(OrganizationsControllerGetOne200ResponseBuilder)? updates,
  ]) =>
      (OrganizationsControllerGetOne200ResponseBuilder()..update(updates))
          ._build();

  _$OrganizationsControllerGetOne200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  OrganizationsControllerGetOne200Response rebuild(
    void Function(OrganizationsControllerGetOne200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  OrganizationsControllerGetOne200ResponseBuilder toBuilder() =>
      OrganizationsControllerGetOne200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is OrganizationsControllerGetOne200Response &&
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
      r'OrganizationsControllerGetOne200Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class OrganizationsControllerGetOne200ResponseBuilder
    implements
        Builder<OrganizationsControllerGetOne200Response,
            OrganizationsControllerGetOne200ResponseBuilder> {
  _$OrganizationsControllerGetOne200Response? _$v;

  OrganizationDetailDtoBuilder? _data;
  OrganizationDetailDtoBuilder get data =>
      _$this._data ??= OrganizationDetailDtoBuilder();
  set data(OrganizationDetailDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  OrganizationsControllerGetOne200ResponseBuilder() {
    OrganizationsControllerGetOne200Response._defaults(this);
  }

  OrganizationsControllerGetOne200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(OrganizationsControllerGetOne200Response other) {
    _$v = other as _$OrganizationsControllerGetOne200Response;
  }

  @override
  void update(
    void Function(OrganizationsControllerGetOne200ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  OrganizationsControllerGetOne200Response build() => _build();

  _$OrganizationsControllerGetOne200Response _build() {
    _$OrganizationsControllerGetOne200Response _$result;
    try {
      _$result = _$v ??
          _$OrganizationsControllerGetOne200Response._(
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
          r'OrganizationsControllerGetOne200Response',
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
