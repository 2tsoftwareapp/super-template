// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'auth_login_controller_login201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuthLoginControllerLogin201Response
    extends AuthLoginControllerLogin201Response {
  @override
  final LoginResponseDto data;
  @override
  final RequestMetaDto meta;

  factory _$AuthLoginControllerLogin201Response([
    void Function(AuthLoginControllerLogin201ResponseBuilder)? updates,
  ]) =>
      (AuthLoginControllerLogin201ResponseBuilder()..update(updates))._build();

  _$AuthLoginControllerLogin201Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AuthLoginControllerLogin201Response rebuild(
    void Function(AuthLoginControllerLogin201ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AuthLoginControllerLogin201ResponseBuilder toBuilder() =>
      AuthLoginControllerLogin201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuthLoginControllerLogin201Response &&
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
    return (newBuiltValueToStringHelper(r'AuthLoginControllerLogin201Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AuthLoginControllerLogin201ResponseBuilder
    implements
        Builder<AuthLoginControllerLogin201Response,
            AuthLoginControllerLogin201ResponseBuilder> {
  _$AuthLoginControllerLogin201Response? _$v;

  LoginResponseDtoBuilder? _data;
  LoginResponseDtoBuilder get data =>
      _$this._data ??= LoginResponseDtoBuilder();
  set data(LoginResponseDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AuthLoginControllerLogin201ResponseBuilder() {
    AuthLoginControllerLogin201Response._defaults(this);
  }

  AuthLoginControllerLogin201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuthLoginControllerLogin201Response other) {
    _$v = other as _$AuthLoginControllerLogin201Response;
  }

  @override
  void update(
    void Function(AuthLoginControllerLogin201ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AuthLoginControllerLogin201Response build() => _build();

  _$AuthLoginControllerLogin201Response _build() {
    _$AuthLoginControllerLogin201Response _$result;
    try {
      _$result = _$v ??
          _$AuthLoginControllerLogin201Response._(
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
          r'AuthLoginControllerLogin201Response',
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
