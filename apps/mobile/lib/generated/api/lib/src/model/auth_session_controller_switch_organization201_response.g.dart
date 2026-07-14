// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'auth_session_controller_switch_organization201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuthSessionControllerSwitchOrganization201Response
    extends AuthSessionControllerSwitchOrganization201Response {
  @override
  final SwitchOrganizationResponseDto data;
  @override
  final RequestMetaDto meta;

  factory _$AuthSessionControllerSwitchOrganization201Response([
    void Function(AuthSessionControllerSwitchOrganization201ResponseBuilder)?
        updates,
  ]) =>
      (AuthSessionControllerSwitchOrganization201ResponseBuilder()
            ..update(updates))
          ._build();

  _$AuthSessionControllerSwitchOrganization201Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AuthSessionControllerSwitchOrganization201Response rebuild(
    void Function(AuthSessionControllerSwitchOrganization201ResponseBuilder)
        updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AuthSessionControllerSwitchOrganization201ResponseBuilder toBuilder() =>
      AuthSessionControllerSwitchOrganization201ResponseBuilder()
        ..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuthSessionControllerSwitchOrganization201Response &&
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
      r'AuthSessionControllerSwitchOrganization201Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AuthSessionControllerSwitchOrganization201ResponseBuilder
    implements
        Builder<AuthSessionControllerSwitchOrganization201Response,
            AuthSessionControllerSwitchOrganization201ResponseBuilder> {
  _$AuthSessionControllerSwitchOrganization201Response? _$v;

  SwitchOrganizationResponseDtoBuilder? _data;
  SwitchOrganizationResponseDtoBuilder get data =>
      _$this._data ??= SwitchOrganizationResponseDtoBuilder();
  set data(SwitchOrganizationResponseDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AuthSessionControllerSwitchOrganization201ResponseBuilder() {
    AuthSessionControllerSwitchOrganization201Response._defaults(this);
  }

  AuthSessionControllerSwitchOrganization201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuthSessionControllerSwitchOrganization201Response other) {
    _$v = other as _$AuthSessionControllerSwitchOrganization201Response;
  }

  @override
  void update(
    void Function(AuthSessionControllerSwitchOrganization201ResponseBuilder)?
        updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AuthSessionControllerSwitchOrganization201Response build() => _build();

  _$AuthSessionControllerSwitchOrganization201Response _build() {
    _$AuthSessionControllerSwitchOrganization201Response _$result;
    try {
      _$result = _$v ??
          _$AuthSessionControllerSwitchOrganization201Response._(
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
          r'AuthSessionControllerSwitchOrganization201Response',
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
