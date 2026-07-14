// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'auth_session_controller_get_me200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuthSessionControllerGetMe200Response
    extends AuthSessionControllerGetMe200Response {
  @override
  final AuthMeDto data;
  @override
  final RequestMetaDto meta;

  factory _$AuthSessionControllerGetMe200Response([
    void Function(AuthSessionControllerGetMe200ResponseBuilder)? updates,
  ]) =>
      (AuthSessionControllerGetMe200ResponseBuilder()..update(updates))
          ._build();

  _$AuthSessionControllerGetMe200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AuthSessionControllerGetMe200Response rebuild(
    void Function(AuthSessionControllerGetMe200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AuthSessionControllerGetMe200ResponseBuilder toBuilder() =>
      AuthSessionControllerGetMe200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuthSessionControllerGetMe200Response &&
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
      r'AuthSessionControllerGetMe200Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AuthSessionControllerGetMe200ResponseBuilder
    implements
        Builder<AuthSessionControllerGetMe200Response,
            AuthSessionControllerGetMe200ResponseBuilder> {
  _$AuthSessionControllerGetMe200Response? _$v;

  AuthMeDtoBuilder? _data;
  AuthMeDtoBuilder get data => _$this._data ??= AuthMeDtoBuilder();
  set data(AuthMeDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AuthSessionControllerGetMe200ResponseBuilder() {
    AuthSessionControllerGetMe200Response._defaults(this);
  }

  AuthSessionControllerGetMe200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuthSessionControllerGetMe200Response other) {
    _$v = other as _$AuthSessionControllerGetMe200Response;
  }

  @override
  void update(
    void Function(AuthSessionControllerGetMe200ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AuthSessionControllerGetMe200Response build() => _build();

  _$AuthSessionControllerGetMe200Response _build() {
    _$AuthSessionControllerGetMe200Response _$result;
    try {
      _$result = _$v ??
          _$AuthSessionControllerGetMe200Response._(
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
          r'AuthSessionControllerGetMe200Response',
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
