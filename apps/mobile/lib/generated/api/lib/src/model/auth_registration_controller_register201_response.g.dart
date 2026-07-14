// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'auth_registration_controller_register201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuthRegistrationControllerRegister201Response
    extends AuthRegistrationControllerRegister201Response {
  @override
  final SuccessMessageDto data;
  @override
  final RequestMetaDto meta;

  factory _$AuthRegistrationControllerRegister201Response([
    void Function(AuthRegistrationControllerRegister201ResponseBuilder)?
        updates,
  ]) =>
      (AuthRegistrationControllerRegister201ResponseBuilder()..update(updates))
          ._build();

  _$AuthRegistrationControllerRegister201Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AuthRegistrationControllerRegister201Response rebuild(
    void Function(AuthRegistrationControllerRegister201ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AuthRegistrationControllerRegister201ResponseBuilder toBuilder() =>
      AuthRegistrationControllerRegister201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuthRegistrationControllerRegister201Response &&
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
      r'AuthRegistrationControllerRegister201Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AuthRegistrationControllerRegister201ResponseBuilder
    implements
        Builder<AuthRegistrationControllerRegister201Response,
            AuthRegistrationControllerRegister201ResponseBuilder> {
  _$AuthRegistrationControllerRegister201Response? _$v;

  SuccessMessageDtoBuilder? _data;
  SuccessMessageDtoBuilder get data =>
      _$this._data ??= SuccessMessageDtoBuilder();
  set data(SuccessMessageDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AuthRegistrationControllerRegister201ResponseBuilder() {
    AuthRegistrationControllerRegister201Response._defaults(this);
  }

  AuthRegistrationControllerRegister201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuthRegistrationControllerRegister201Response other) {
    _$v = other as _$AuthRegistrationControllerRegister201Response;
  }

  @override
  void update(
    void Function(AuthRegistrationControllerRegister201ResponseBuilder)?
        updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AuthRegistrationControllerRegister201Response build() => _build();

  _$AuthRegistrationControllerRegister201Response _build() {
    _$AuthRegistrationControllerRegister201Response _$result;
    try {
      _$result = _$v ??
          _$AuthRegistrationControllerRegister201Response._(
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
          r'AuthRegistrationControllerRegister201Response',
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
