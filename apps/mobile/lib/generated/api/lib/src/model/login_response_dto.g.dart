// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'login_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LoginResponseDto extends LoginResponseDto {
  @override
  final String? accessToken;
  @override
  final bool mfaRequired;
  @override
  final String? mfaToken;
  @override
  final bool? mustChangePassword;
  @override
  final String? organizationId;
  @override
  final BuiltList<String>? permissions;
  @override
  final String? refreshToken;
  @override
  final AuthSessionDto? session;
  @override
  final AuthUserDto? user;

  factory _$LoginResponseDto([
    void Function(LoginResponseDtoBuilder)? updates,
  ]) =>
      (LoginResponseDtoBuilder()..update(updates))._build();

  _$LoginResponseDto._({
    this.accessToken,
    required this.mfaRequired,
    this.mfaToken,
    this.mustChangePassword,
    this.organizationId,
    this.permissions,
    this.refreshToken,
    this.session,
    this.user,
  }) : super._();
  @override
  LoginResponseDto rebuild(void Function(LoginResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LoginResponseDtoBuilder toBuilder() =>
      LoginResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LoginResponseDto &&
        accessToken == other.accessToken &&
        mfaRequired == other.mfaRequired &&
        mfaToken == other.mfaToken &&
        mustChangePassword == other.mustChangePassword &&
        organizationId == other.organizationId &&
        permissions == other.permissions &&
        refreshToken == other.refreshToken &&
        session == other.session &&
        user == other.user;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, accessToken.hashCode);
    _$hash = $jc(_$hash, mfaRequired.hashCode);
    _$hash = $jc(_$hash, mfaToken.hashCode);
    _$hash = $jc(_$hash, mustChangePassword.hashCode);
    _$hash = $jc(_$hash, organizationId.hashCode);
    _$hash = $jc(_$hash, permissions.hashCode);
    _$hash = $jc(_$hash, refreshToken.hashCode);
    _$hash = $jc(_$hash, session.hashCode);
    _$hash = $jc(_$hash, user.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LoginResponseDto')
          ..add('accessToken', accessToken)
          ..add('mfaRequired', mfaRequired)
          ..add('mfaToken', mfaToken)
          ..add('mustChangePassword', mustChangePassword)
          ..add('organizationId', organizationId)
          ..add('permissions', permissions)
          ..add('refreshToken', refreshToken)
          ..add('session', session)
          ..add('user', user))
        .toString();
  }
}

class LoginResponseDtoBuilder
    implements Builder<LoginResponseDto, LoginResponseDtoBuilder> {
  _$LoginResponseDto? _$v;

  String? _accessToken;
  String? get accessToken => _$this._accessToken;
  set accessToken(String? accessToken) => _$this._accessToken = accessToken;

  bool? _mfaRequired;
  bool? get mfaRequired => _$this._mfaRequired;
  set mfaRequired(bool? mfaRequired) => _$this._mfaRequired = mfaRequired;

  String? _mfaToken;
  String? get mfaToken => _$this._mfaToken;
  set mfaToken(String? mfaToken) => _$this._mfaToken = mfaToken;

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

  String? _refreshToken;
  String? get refreshToken => _$this._refreshToken;
  set refreshToken(String? refreshToken) => _$this._refreshToken = refreshToken;

  AuthSessionDtoBuilder? _session;
  AuthSessionDtoBuilder get session =>
      _$this._session ??= AuthSessionDtoBuilder();
  set session(AuthSessionDtoBuilder? session) => _$this._session = session;

  AuthUserDtoBuilder? _user;
  AuthUserDtoBuilder get user => _$this._user ??= AuthUserDtoBuilder();
  set user(AuthUserDtoBuilder? user) => _$this._user = user;

  LoginResponseDtoBuilder() {
    LoginResponseDto._defaults(this);
  }

  LoginResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _accessToken = $v.accessToken;
      _mfaRequired = $v.mfaRequired;
      _mfaToken = $v.mfaToken;
      _mustChangePassword = $v.mustChangePassword;
      _organizationId = $v.organizationId;
      _permissions = $v.permissions?.toBuilder();
      _refreshToken = $v.refreshToken;
      _session = $v.session?.toBuilder();
      _user = $v.user?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LoginResponseDto other) {
    _$v = other as _$LoginResponseDto;
  }

  @override
  void update(void Function(LoginResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LoginResponseDto build() => _build();

  _$LoginResponseDto _build() {
    _$LoginResponseDto _$result;
    try {
      _$result = _$v ??
          _$LoginResponseDto._(
            accessToken: accessToken,
            mfaRequired: BuiltValueNullFieldError.checkNotNull(
              mfaRequired,
              r'LoginResponseDto',
              'mfaRequired',
            ),
            mfaToken: mfaToken,
            mustChangePassword: mustChangePassword,
            organizationId: organizationId,
            permissions: _permissions?.build(),
            refreshToken: refreshToken,
            session: _session?.build(),
            user: _user?.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'permissions';
        _permissions?.build();

        _$failedField = 'session';
        _session?.build();
        _$failedField = 'user';
        _user?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'LoginResponseDto',
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
