// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'auth_controller_get_me200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuthControllerGetMe200Response extends AuthControllerGetMe200Response {
  @override
  final AuthMeDto data;
  @override
  final RequestMetaDto meta;

  factory _$AuthControllerGetMe200Response([
    void Function(AuthControllerGetMe200ResponseBuilder)? updates,
  ]) =>
      (AuthControllerGetMe200ResponseBuilder()..update(updates))._build();

  _$AuthControllerGetMe200Response._({required this.data, required this.meta})
      : super._();
  @override
  AuthControllerGetMe200Response rebuild(
    void Function(AuthControllerGetMe200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AuthControllerGetMe200ResponseBuilder toBuilder() =>
      AuthControllerGetMe200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuthControllerGetMe200Response &&
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
    return (newBuiltValueToStringHelper(r'AuthControllerGetMe200Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AuthControllerGetMe200ResponseBuilder
    implements
        Builder<AuthControllerGetMe200Response,
            AuthControllerGetMe200ResponseBuilder> {
  _$AuthControllerGetMe200Response? _$v;

  AuthMeDtoBuilder? _data;
  AuthMeDtoBuilder get data => _$this._data ??= AuthMeDtoBuilder();
  set data(AuthMeDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AuthControllerGetMe200ResponseBuilder() {
    AuthControllerGetMe200Response._defaults(this);
  }

  AuthControllerGetMe200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuthControllerGetMe200Response other) {
    _$v = other as _$AuthControllerGetMe200Response;
  }

  @override
  void update(void Function(AuthControllerGetMe200ResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AuthControllerGetMe200Response build() => _build();

  _$AuthControllerGetMe200Response _build() {
    _$AuthControllerGetMe200Response _$result;
    try {
      _$result = _$v ??
          _$AuthControllerGetMe200Response._(
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
          r'AuthControllerGetMe200Response',
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
