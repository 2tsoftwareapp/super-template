// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'auth_controller_login201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuthControllerLogin201Response extends AuthControllerLogin201Response {
  @override
  final AuthResponseDto data;
  @override
  final RequestMetaDto meta;

  factory _$AuthControllerLogin201Response(
          [void Function(AuthControllerLogin201ResponseBuilder)? updates]) =>
      (AuthControllerLogin201ResponseBuilder()..update(updates))._build();

  _$AuthControllerLogin201Response._({required this.data, required this.meta})
      : super._();
  @override
  AuthControllerLogin201Response rebuild(
          void Function(AuthControllerLogin201ResponseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AuthControllerLogin201ResponseBuilder toBuilder() =>
      AuthControllerLogin201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuthControllerLogin201Response &&
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
    return (newBuiltValueToStringHelper(r'AuthControllerLogin201Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AuthControllerLogin201ResponseBuilder
    implements
        Builder<AuthControllerLogin201Response,
            AuthControllerLogin201ResponseBuilder> {
  _$AuthControllerLogin201Response? _$v;

  AuthResponseDtoBuilder? _data;
  AuthResponseDtoBuilder get data => _$this._data ??= AuthResponseDtoBuilder();
  set data(AuthResponseDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AuthControllerLogin201ResponseBuilder() {
    AuthControllerLogin201Response._defaults(this);
  }

  AuthControllerLogin201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuthControllerLogin201Response other) {
    _$v = other as _$AuthControllerLogin201Response;
  }

  @override
  void update(void Function(AuthControllerLogin201ResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AuthControllerLogin201Response build() => _build();

  _$AuthControllerLogin201Response _build() {
    _$AuthControllerLogin201Response _$result;
    try {
      _$result = _$v ??
          _$AuthControllerLogin201Response._(
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
            r'AuthControllerLogin201Response', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
