// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'auth_controller_verify_mfa_challenge201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuthControllerVerifyMfaChallenge201Response
    extends AuthControllerVerifyMfaChallenge201Response {
  @override
  final AuthResponseDto data;
  @override
  final RequestMetaDto meta;

  factory _$AuthControllerVerifyMfaChallenge201Response([
    void Function(AuthControllerVerifyMfaChallenge201ResponseBuilder)? updates,
  ]) =>
      (AuthControllerVerifyMfaChallenge201ResponseBuilder()..update(updates))
          ._build();

  _$AuthControllerVerifyMfaChallenge201Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AuthControllerVerifyMfaChallenge201Response rebuild(
    void Function(AuthControllerVerifyMfaChallenge201ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AuthControllerVerifyMfaChallenge201ResponseBuilder toBuilder() =>
      AuthControllerVerifyMfaChallenge201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuthControllerVerifyMfaChallenge201Response &&
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
      r'AuthControllerVerifyMfaChallenge201Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AuthControllerVerifyMfaChallenge201ResponseBuilder
    implements
        Builder<AuthControllerVerifyMfaChallenge201Response,
            AuthControllerVerifyMfaChallenge201ResponseBuilder> {
  _$AuthControllerVerifyMfaChallenge201Response? _$v;

  AuthResponseDtoBuilder? _data;
  AuthResponseDtoBuilder get data => _$this._data ??= AuthResponseDtoBuilder();
  set data(AuthResponseDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AuthControllerVerifyMfaChallenge201ResponseBuilder() {
    AuthControllerVerifyMfaChallenge201Response._defaults(this);
  }

  AuthControllerVerifyMfaChallenge201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuthControllerVerifyMfaChallenge201Response other) {
    _$v = other as _$AuthControllerVerifyMfaChallenge201Response;
  }

  @override
  void update(
    void Function(AuthControllerVerifyMfaChallenge201ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AuthControllerVerifyMfaChallenge201Response build() => _build();

  _$AuthControllerVerifyMfaChallenge201Response _build() {
    _$AuthControllerVerifyMfaChallenge201Response _$result;
    try {
      _$result = _$v ??
          _$AuthControllerVerifyMfaChallenge201Response._(
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
          r'AuthControllerVerifyMfaChallenge201Response',
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
