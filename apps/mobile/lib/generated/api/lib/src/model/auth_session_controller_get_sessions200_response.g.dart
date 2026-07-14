// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'auth_session_controller_get_sessions200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuthSessionControllerGetSessions200Response
    extends AuthSessionControllerGetSessions200Response {
  @override
  final BuiltList<AuthSessionDto> data;
  @override
  final RequestMetaDto meta;

  factory _$AuthSessionControllerGetSessions200Response([
    void Function(AuthSessionControllerGetSessions200ResponseBuilder)? updates,
  ]) =>
      (AuthSessionControllerGetSessions200ResponseBuilder()..update(updates))
          ._build();

  _$AuthSessionControllerGetSessions200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AuthSessionControllerGetSessions200Response rebuild(
    void Function(AuthSessionControllerGetSessions200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AuthSessionControllerGetSessions200ResponseBuilder toBuilder() =>
      AuthSessionControllerGetSessions200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuthSessionControllerGetSessions200Response &&
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
      r'AuthSessionControllerGetSessions200Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AuthSessionControllerGetSessions200ResponseBuilder
    implements
        Builder<AuthSessionControllerGetSessions200Response,
            AuthSessionControllerGetSessions200ResponseBuilder> {
  _$AuthSessionControllerGetSessions200Response? _$v;

  ListBuilder<AuthSessionDto>? _data;
  ListBuilder<AuthSessionDto> get data =>
      _$this._data ??= ListBuilder<AuthSessionDto>();
  set data(ListBuilder<AuthSessionDto>? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AuthSessionControllerGetSessions200ResponseBuilder() {
    AuthSessionControllerGetSessions200Response._defaults(this);
  }

  AuthSessionControllerGetSessions200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuthSessionControllerGetSessions200Response other) {
    _$v = other as _$AuthSessionControllerGetSessions200Response;
  }

  @override
  void update(
    void Function(AuthSessionControllerGetSessions200ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AuthSessionControllerGetSessions200Response build() => _build();

  _$AuthSessionControllerGetSessions200Response _build() {
    _$AuthSessionControllerGetSessions200Response _$result;
    try {
      _$result = _$v ??
          _$AuthSessionControllerGetSessions200Response._(
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
          r'AuthSessionControllerGetSessions200Response',
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
