// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'auth_me_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuthMeDto extends AuthMeDto {
  @override
  final UserDto user;
  @override
  final BuiltList<String> permissions;
  @override
  final String sessionId;
  @override
  final JsonObject? organizationId;
  @override
  final bool? mustChangePassword;

  factory _$AuthMeDto([void Function(AuthMeDtoBuilder)? updates]) =>
      (AuthMeDtoBuilder()..update(updates))._build();

  _$AuthMeDto._({
    required this.user,
    required this.permissions,
    required this.sessionId,
    this.organizationId,
    this.mustChangePassword,
  }) : super._();
  @override
  AuthMeDto rebuild(void Function(AuthMeDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AuthMeDtoBuilder toBuilder() => AuthMeDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuthMeDto &&
        user == other.user &&
        permissions == other.permissions &&
        sessionId == other.sessionId &&
        organizationId == other.organizationId &&
        mustChangePassword == other.mustChangePassword;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, user.hashCode);
    _$hash = $jc(_$hash, permissions.hashCode);
    _$hash = $jc(_$hash, sessionId.hashCode);
    _$hash = $jc(_$hash, organizationId.hashCode);
    _$hash = $jc(_$hash, mustChangePassword.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AuthMeDto')
          ..add('user', user)
          ..add('permissions', permissions)
          ..add('sessionId', sessionId)
          ..add('organizationId', organizationId)
          ..add('mustChangePassword', mustChangePassword))
        .toString();
  }
}

class AuthMeDtoBuilder implements Builder<AuthMeDto, AuthMeDtoBuilder> {
  _$AuthMeDto? _$v;

  UserDtoBuilder? _user;
  UserDtoBuilder get user => _$this._user ??= UserDtoBuilder();
  set user(UserDtoBuilder? user) => _$this._user = user;

  ListBuilder<String>? _permissions;
  ListBuilder<String> get permissions =>
      _$this._permissions ??= ListBuilder<String>();
  set permissions(ListBuilder<String>? permissions) =>
      _$this._permissions = permissions;

  String? _sessionId;
  String? get sessionId => _$this._sessionId;
  set sessionId(String? sessionId) => _$this._sessionId = sessionId;

  JsonObject? _organizationId;
  JsonObject? get organizationId => _$this._organizationId;
  set organizationId(JsonObject? organizationId) =>
      _$this._organizationId = organizationId;

  bool? _mustChangePassword;
  bool? get mustChangePassword => _$this._mustChangePassword;
  set mustChangePassword(bool? mustChangePassword) =>
      _$this._mustChangePassword = mustChangePassword;

  AuthMeDtoBuilder() {
    AuthMeDto._defaults(this);
  }

  AuthMeDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _user = $v.user.toBuilder();
      _permissions = $v.permissions.toBuilder();
      _sessionId = $v.sessionId;
      _organizationId = $v.organizationId;
      _mustChangePassword = $v.mustChangePassword;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuthMeDto other) {
    _$v = other as _$AuthMeDto;
  }

  @override
  void update(void Function(AuthMeDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AuthMeDto build() => _build();

  _$AuthMeDto _build() {
    _$AuthMeDto _$result;
    try {
      _$result = _$v ??
          _$AuthMeDto._(
            user: user.build(),
            permissions: permissions.build(),
            sessionId: BuiltValueNullFieldError.checkNotNull(
              sessionId,
              r'AuthMeDto',
              'sessionId',
            ),
            organizationId: organizationId,
            mustChangePassword: mustChangePassword,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'user';
        user.build();
        _$failedField = 'permissions';
        permissions.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'AuthMeDto',
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
