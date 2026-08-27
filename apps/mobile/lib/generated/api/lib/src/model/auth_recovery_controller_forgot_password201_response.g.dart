// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'auth_recovery_controller_forgot_password201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuthRecoveryControllerForgotPassword201Response
    extends AuthRecoveryControllerForgotPassword201Response {
  @override
  final SuccessMessageDto data;
  @override
  final RequestMetaDto meta;

  factory _$AuthRecoveryControllerForgotPassword201Response([
    void Function(AuthRecoveryControllerForgotPassword201ResponseBuilder)?
        updates,
  ]) =>
      (AuthRecoveryControllerForgotPassword201ResponseBuilder()
            ..update(updates))
          ._build();

  _$AuthRecoveryControllerForgotPassword201Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AuthRecoveryControllerForgotPassword201Response rebuild(
    void Function(AuthRecoveryControllerForgotPassword201ResponseBuilder)
        updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AuthRecoveryControllerForgotPassword201ResponseBuilder toBuilder() =>
      AuthRecoveryControllerForgotPassword201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuthRecoveryControllerForgotPassword201Response &&
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
      r'AuthRecoveryControllerForgotPassword201Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AuthRecoveryControllerForgotPassword201ResponseBuilder
    implements
        Builder<AuthRecoveryControllerForgotPassword201Response,
            AuthRecoveryControllerForgotPassword201ResponseBuilder> {
  _$AuthRecoveryControllerForgotPassword201Response? _$v;

  SuccessMessageDtoBuilder? _data;
  SuccessMessageDtoBuilder get data =>
      _$this._data ??= SuccessMessageDtoBuilder();
  set data(SuccessMessageDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AuthRecoveryControllerForgotPassword201ResponseBuilder() {
    AuthRecoveryControllerForgotPassword201Response._defaults(this);
  }

  AuthRecoveryControllerForgotPassword201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuthRecoveryControllerForgotPassword201Response other) {
    _$v = other as _$AuthRecoveryControllerForgotPassword201Response;
  }

  @override
  void update(
    void Function(AuthRecoveryControllerForgotPassword201ResponseBuilder)?
        updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AuthRecoveryControllerForgotPassword201Response build() => _build();

  _$AuthRecoveryControllerForgotPassword201Response _build() {
    _$AuthRecoveryControllerForgotPassword201Response _$result;
    try {
      _$result = _$v ??
          _$AuthRecoveryControllerForgotPassword201Response._(
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
          r'AuthRecoveryControllerForgotPassword201Response',
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
