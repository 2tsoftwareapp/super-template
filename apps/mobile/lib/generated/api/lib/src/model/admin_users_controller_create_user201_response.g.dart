// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_users_controller_create_user201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminUsersControllerCreateUser201Response
    extends AdminUsersControllerCreateUser201Response {
  @override
  final UserDto data;
  @override
  final RequestMetaDto meta;

  factory _$AdminUsersControllerCreateUser201Response([
    void Function(AdminUsersControllerCreateUser201ResponseBuilder)? updates,
  ]) => (AdminUsersControllerCreateUser201ResponseBuilder()..update(updates))
      ._build();

  _$AdminUsersControllerCreateUser201Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AdminUsersControllerCreateUser201Response rebuild(
    void Function(AdminUsersControllerCreateUser201ResponseBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  AdminUsersControllerCreateUser201ResponseBuilder toBuilder() =>
      AdminUsersControllerCreateUser201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminUsersControllerCreateUser201Response &&
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
            r'AdminUsersControllerCreateUser201Response',
          )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AdminUsersControllerCreateUser201ResponseBuilder
    implements
        Builder<
          AdminUsersControllerCreateUser201Response,
          AdminUsersControllerCreateUser201ResponseBuilder
        > {
  _$AdminUsersControllerCreateUser201Response? _$v;

  UserDtoBuilder? _data;
  UserDtoBuilder get data => _$this._data ??= UserDtoBuilder();
  set data(UserDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AdminUsersControllerCreateUser201ResponseBuilder() {
    AdminUsersControllerCreateUser201Response._defaults(this);
  }

  AdminUsersControllerCreateUser201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminUsersControllerCreateUser201Response other) {
    _$v = other as _$AdminUsersControllerCreateUser201Response;
  }

  @override
  void update(
    void Function(AdminUsersControllerCreateUser201ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AdminUsersControllerCreateUser201Response build() => _build();

  _$AdminUsersControllerCreateUser201Response _build() {
    _$AdminUsersControllerCreateUser201Response _$result;
    try {
      _$result =
          _$v ??
          _$AdminUsersControllerCreateUser201Response._(
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
          r'AdminUsersControllerCreateUser201Response',
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
