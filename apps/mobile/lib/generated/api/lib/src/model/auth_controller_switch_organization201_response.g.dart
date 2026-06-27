// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'auth_controller_switch_organization201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuthControllerSwitchOrganization201Response
    extends AuthControllerSwitchOrganization201Response {
  @override
  final SwitchOrganizationResponseDto data;
  @override
  final RequestMetaDto meta;

  factory _$AuthControllerSwitchOrganization201Response([
    void Function(AuthControllerSwitchOrganization201ResponseBuilder)? updates,
  ]) =>
      (AuthControllerSwitchOrganization201ResponseBuilder()..update(updates))
          ._build();

  _$AuthControllerSwitchOrganization201Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AuthControllerSwitchOrganization201Response rebuild(
    void Function(AuthControllerSwitchOrganization201ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AuthControllerSwitchOrganization201ResponseBuilder toBuilder() =>
      AuthControllerSwitchOrganization201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuthControllerSwitchOrganization201Response &&
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
      r'AuthControllerSwitchOrganization201Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AuthControllerSwitchOrganization201ResponseBuilder
    implements
        Builder<AuthControllerSwitchOrganization201Response,
            AuthControllerSwitchOrganization201ResponseBuilder> {
  _$AuthControllerSwitchOrganization201Response? _$v;

  SwitchOrganizationResponseDtoBuilder? _data;
  SwitchOrganizationResponseDtoBuilder get data =>
      _$this._data ??= SwitchOrganizationResponseDtoBuilder();
  set data(SwitchOrganizationResponseDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AuthControllerSwitchOrganization201ResponseBuilder() {
    AuthControllerSwitchOrganization201Response._defaults(this);
  }

  AuthControllerSwitchOrganization201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuthControllerSwitchOrganization201Response other) {
    _$v = other as _$AuthControllerSwitchOrganization201Response;
  }

  @override
  void update(
    void Function(AuthControllerSwitchOrganization201ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AuthControllerSwitchOrganization201Response build() => _build();

  _$AuthControllerSwitchOrganization201Response _build() {
    _$AuthControllerSwitchOrganization201Response _$result;
    try {
      _$result = _$v ??
          _$AuthControllerSwitchOrganization201Response._(
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
          r'AuthControllerSwitchOrganization201Response',
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
