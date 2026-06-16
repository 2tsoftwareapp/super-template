// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'auth_controller_register201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuthControllerRegister201Response
    extends AuthControllerRegister201Response {
  @override
  final SuccessMessageDto data;
  @override
  final RequestMetaDto meta;

  factory _$AuthControllerRegister201Response(
          [void Function(AuthControllerRegister201ResponseBuilder)? updates]) =>
      (AuthControllerRegister201ResponseBuilder()..update(updates))._build();

  _$AuthControllerRegister201Response._(
      {required this.data, required this.meta})
      : super._();
  @override
  AuthControllerRegister201Response rebuild(
          void Function(AuthControllerRegister201ResponseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AuthControllerRegister201ResponseBuilder toBuilder() =>
      AuthControllerRegister201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuthControllerRegister201Response &&
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
    return (newBuiltValueToStringHelper(r'AuthControllerRegister201Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AuthControllerRegister201ResponseBuilder
    implements
        Builder<AuthControllerRegister201Response,
            AuthControllerRegister201ResponseBuilder> {
  _$AuthControllerRegister201Response? _$v;

  SuccessMessageDtoBuilder? _data;
  SuccessMessageDtoBuilder get data =>
      _$this._data ??= SuccessMessageDtoBuilder();
  set data(SuccessMessageDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AuthControllerRegister201ResponseBuilder() {
    AuthControllerRegister201Response._defaults(this);
  }

  AuthControllerRegister201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuthControllerRegister201Response other) {
    _$v = other as _$AuthControllerRegister201Response;
  }

  @override
  void update(
      void Function(AuthControllerRegister201ResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AuthControllerRegister201Response build() => _build();

  _$AuthControllerRegister201Response _build() {
    _$AuthControllerRegister201Response _$result;
    try {
      _$result = _$v ??
          _$AuthControllerRegister201Response._(
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
            r'AuthControllerRegister201Response', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
