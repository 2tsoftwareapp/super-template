// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'organizations_controller_update_member_role200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$OrganizationsControllerUpdateMemberRole200Response
    extends OrganizationsControllerUpdateMemberRole200Response {
  @override
  final OrganizationMemberDto data;
  @override
  final RequestMetaDto meta;

  factory _$OrganizationsControllerUpdateMemberRole200Response([
    void Function(OrganizationsControllerUpdateMemberRole200ResponseBuilder)?
        updates,
  ]) =>
      (OrganizationsControllerUpdateMemberRole200ResponseBuilder()
            ..update(updates))
          ._build();

  _$OrganizationsControllerUpdateMemberRole200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  OrganizationsControllerUpdateMemberRole200Response rebuild(
    void Function(OrganizationsControllerUpdateMemberRole200ResponseBuilder)
        updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  OrganizationsControllerUpdateMemberRole200ResponseBuilder toBuilder() =>
      OrganizationsControllerUpdateMemberRole200ResponseBuilder()
        ..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is OrganizationsControllerUpdateMemberRole200Response &&
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
      r'OrganizationsControllerUpdateMemberRole200Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class OrganizationsControllerUpdateMemberRole200ResponseBuilder
    implements
        Builder<OrganizationsControllerUpdateMemberRole200Response,
            OrganizationsControllerUpdateMemberRole200ResponseBuilder> {
  _$OrganizationsControllerUpdateMemberRole200Response? _$v;

  OrganizationMemberDtoBuilder? _data;
  OrganizationMemberDtoBuilder get data =>
      _$this._data ??= OrganizationMemberDtoBuilder();
  set data(OrganizationMemberDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  OrganizationsControllerUpdateMemberRole200ResponseBuilder() {
    OrganizationsControllerUpdateMemberRole200Response._defaults(this);
  }

  OrganizationsControllerUpdateMemberRole200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(OrganizationsControllerUpdateMemberRole200Response other) {
    _$v = other as _$OrganizationsControllerUpdateMemberRole200Response;
  }

  @override
  void update(
    void Function(OrganizationsControllerUpdateMemberRole200ResponseBuilder)?
        updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  OrganizationsControllerUpdateMemberRole200Response build() => _build();

  _$OrganizationsControllerUpdateMemberRole200Response _build() {
    _$OrganizationsControllerUpdateMemberRole200Response _$result;
    try {
      _$result = _$v ??
          _$OrganizationsControllerUpdateMemberRole200Response._(
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
          r'OrganizationsControllerUpdateMemberRole200Response',
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
