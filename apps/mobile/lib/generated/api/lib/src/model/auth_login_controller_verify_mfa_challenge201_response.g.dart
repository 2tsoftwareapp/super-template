// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'auth_login_controller_verify_mfa_challenge201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuthLoginControllerVerifyMfaChallenge201Response
    extends AuthLoginControllerVerifyMfaChallenge201Response {
  @override
  final AuthResponseDto data;
  @override
  final RequestMetaDto meta;

  factory _$AuthLoginControllerVerifyMfaChallenge201Response([
    void Function(AuthLoginControllerVerifyMfaChallenge201ResponseBuilder)?
        updates,
  ]) =>
      (AuthLoginControllerVerifyMfaChallenge201ResponseBuilder()
            ..update(updates))
          ._build();

  _$AuthLoginControllerVerifyMfaChallenge201Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AuthLoginControllerVerifyMfaChallenge201Response rebuild(
    void Function(AuthLoginControllerVerifyMfaChallenge201ResponseBuilder)
        updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AuthLoginControllerVerifyMfaChallenge201ResponseBuilder toBuilder() =>
      AuthLoginControllerVerifyMfaChallenge201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuthLoginControllerVerifyMfaChallenge201Response &&
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
      r'AuthLoginControllerVerifyMfaChallenge201Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AuthLoginControllerVerifyMfaChallenge201ResponseBuilder
    implements
        Builder<AuthLoginControllerVerifyMfaChallenge201Response,
            AuthLoginControllerVerifyMfaChallenge201ResponseBuilder> {
  _$AuthLoginControllerVerifyMfaChallenge201Response? _$v;

  AuthResponseDtoBuilder? _data;
  AuthResponseDtoBuilder get data => _$this._data ??= AuthResponseDtoBuilder();
  set data(AuthResponseDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AuthLoginControllerVerifyMfaChallenge201ResponseBuilder() {
    AuthLoginControllerVerifyMfaChallenge201Response._defaults(this);
  }

  AuthLoginControllerVerifyMfaChallenge201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuthLoginControllerVerifyMfaChallenge201Response other) {
    _$v = other as _$AuthLoginControllerVerifyMfaChallenge201Response;
  }

  @override
  void update(
    void Function(AuthLoginControllerVerifyMfaChallenge201ResponseBuilder)?
        updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AuthLoginControllerVerifyMfaChallenge201Response build() => _build();

  _$AuthLoginControllerVerifyMfaChallenge201Response _build() {
    _$AuthLoginControllerVerifyMfaChallenge201Response _$result;
    try {
      _$result = _$v ??
          _$AuthLoginControllerVerifyMfaChallenge201Response._(
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
          r'AuthLoginControllerVerifyMfaChallenge201Response',
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
