// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'auth_me_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuthMeDto extends AuthMeDto {
  @override
  final bool? mustChangePassword;
  @override
  final String? organizationId;
  @override
  final BuiltList<String> permissions;
  @override
  final String sessionId;
  @override
  final AuthUserDto user;

  factory _$AuthMeDto([void Function(AuthMeDtoBuilder)? updates]) =>
      (AuthMeDtoBuilder()..update(updates))._build();

  _$AuthMeDto._({
    this.mustChangePassword,
    this.organizationId,
    required this.permissions,
    required this.sessionId,
    required this.user,
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
        mustChangePassword == other.mustChangePassword &&
        organizationId == other.organizationId &&
        permissions == other.permissions &&
        sessionId == other.sessionId &&
        user == other.user;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, mustChangePassword.hashCode);
    _$hash = $jc(_$hash, organizationId.hashCode);
    _$hash = $jc(_$hash, permissions.hashCode);
    _$hash = $jc(_$hash, sessionId.hashCode);
    _$hash = $jc(_$hash, user.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AuthMeDto')
          ..add('mustChangePassword', mustChangePassword)
          ..add('organizationId', organizationId)
          ..add('permissions', permissions)
          ..add('sessionId', sessionId)
          ..add('user', user))
        .toString();
  }
}

class AuthMeDtoBuilder implements Builder<AuthMeDto, AuthMeDtoBuilder> {
  _$AuthMeDto? _$v;

  bool? _mustChangePassword;
  bool? get mustChangePassword => _$this._mustChangePassword;
  set mustChangePassword(bool? mustChangePassword) =>
      _$this._mustChangePassword = mustChangePassword;

  String? _organizationId;
  String? get organizationId => _$this._organizationId;
  set organizationId(String? organizationId) =>
      _$this._organizationId = organizationId;

  ListBuilder<String>? _permissions;
  ListBuilder<String> get permissions =>
      _$this._permissions ??= ListBuilder<String>();
  set permissions(ListBuilder<String>? permissions) =>
      _$this._permissions = permissions;

  String? _sessionId;
  String? get sessionId => _$this._sessionId;
  set sessionId(String? sessionId) => _$this._sessionId = sessionId;

  AuthUserDtoBuilder? _user;
  AuthUserDtoBuilder get user => _$this._user ??= AuthUserDtoBuilder();
  set user(AuthUserDtoBuilder? user) => _$this._user = user;

  AuthMeDtoBuilder() {
    AuthMeDto._defaults(this);
  }

  AuthMeDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _mustChangePassword = $v.mustChangePassword;
      _organizationId = $v.organizationId;
      _permissions = $v.permissions.toBuilder();
      _sessionId = $v.sessionId;
      _user = $v.user.toBuilder();
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
            mustChangePassword: mustChangePassword,
            organizationId: organizationId,
            permissions: permissions.build(),
            sessionId: BuiltValueNullFieldError.checkNotNull(
              sessionId,
              r'AuthMeDto',
              'sessionId',
            ),
            user: user.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'permissions';
        permissions.build();

        _$failedField = 'user';
        user.build();
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
