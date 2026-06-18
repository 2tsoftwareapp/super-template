// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'organizations_controller_list200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$OrganizationsControllerList200Response
    extends OrganizationsControllerList200Response {
  @override
  final BuiltList<OrganizationDto> data;
  @override
  final RequestMetaDto meta;

  factory _$OrganizationsControllerList200Response([
    void Function(OrganizationsControllerList200ResponseBuilder)? updates,
  ]) =>
      (OrganizationsControllerList200ResponseBuilder()..update(updates))
          ._build();

  _$OrganizationsControllerList200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  OrganizationsControllerList200Response rebuild(
    void Function(OrganizationsControllerList200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  OrganizationsControllerList200ResponseBuilder toBuilder() =>
      OrganizationsControllerList200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is OrganizationsControllerList200Response &&
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
      r'OrganizationsControllerList200Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class OrganizationsControllerList200ResponseBuilder
    implements
        Builder<OrganizationsControllerList200Response,
            OrganizationsControllerList200ResponseBuilder> {
  _$OrganizationsControllerList200Response? _$v;

  ListBuilder<OrganizationDto>? _data;
  ListBuilder<OrganizationDto> get data =>
      _$this._data ??= ListBuilder<OrganizationDto>();
  set data(ListBuilder<OrganizationDto>? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  OrganizationsControllerList200ResponseBuilder() {
    OrganizationsControllerList200Response._defaults(this);
  }

  OrganizationsControllerList200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(OrganizationsControllerList200Response other) {
    _$v = other as _$OrganizationsControllerList200Response;
  }

  @override
  void update(
    void Function(OrganizationsControllerList200ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  OrganizationsControllerList200Response build() => _build();

  _$OrganizationsControllerList200Response _build() {
    _$OrganizationsControllerList200Response _$result;
    try {
      _$result = _$v ??
          _$OrganizationsControllerList200Response._(
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
          r'OrganizationsControllerList200Response',
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
