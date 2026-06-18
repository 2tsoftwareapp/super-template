// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'auth_controller_get_sessions200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuthControllerGetSessions200Response
    extends AuthControllerGetSessions200Response {
  @override
  final BuiltList<AuthSessionDto> data;
  @override
  final RequestMetaDto meta;

  factory _$AuthControllerGetSessions200Response([
    void Function(AuthControllerGetSessions200ResponseBuilder)? updates,
  ]) =>
      (AuthControllerGetSessions200ResponseBuilder()..update(updates))._build();

  _$AuthControllerGetSessions200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AuthControllerGetSessions200Response rebuild(
    void Function(AuthControllerGetSessions200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AuthControllerGetSessions200ResponseBuilder toBuilder() =>
      AuthControllerGetSessions200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuthControllerGetSessions200Response &&
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
    return (newBuiltValueToStringHelper(r'AuthControllerGetSessions200Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AuthControllerGetSessions200ResponseBuilder
    implements
        Builder<AuthControllerGetSessions200Response,
            AuthControllerGetSessions200ResponseBuilder> {
  _$AuthControllerGetSessions200Response? _$v;

  ListBuilder<AuthSessionDto>? _data;
  ListBuilder<AuthSessionDto> get data =>
      _$this._data ??= ListBuilder<AuthSessionDto>();
  set data(ListBuilder<AuthSessionDto>? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AuthControllerGetSessions200ResponseBuilder() {
    AuthControllerGetSessions200Response._defaults(this);
  }

  AuthControllerGetSessions200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuthControllerGetSessions200Response other) {
    _$v = other as _$AuthControllerGetSessions200Response;
  }

  @override
  void update(
    void Function(AuthControllerGetSessions200ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AuthControllerGetSessions200Response build() => _build();

  _$AuthControllerGetSessions200Response _build() {
    _$AuthControllerGetSessions200Response _$result;
    try {
      _$result = _$v ??
          _$AuthControllerGetSessions200Response._(
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
          r'AuthControllerGetSessions200Response',
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
