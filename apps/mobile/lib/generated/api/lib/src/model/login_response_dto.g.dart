// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'login_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LoginResponseDto extends LoginResponseDto {
  @override
  final bool mfaRequired;
  @override
  final String? mfaToken;
  @override
  final String? accessToken;
  @override
  final String? refreshToken;
  @override
  final UserDto? user;
  @override
  final BuiltList<String>? permissions;
  @override
  final AuthSessionDto? session;
  @override
  final JsonObject? organizationId;
  @override
  final bool? mustChangePassword;

  factory _$LoginResponseDto([
    void Function(LoginResponseDtoBuilder)? updates,
  ]) =>
      (LoginResponseDtoBuilder()..update(updates))._build();

  _$LoginResponseDto._({
    required this.mfaRequired,
    this.mfaToken,
    this.accessToken,
    this.refreshToken,
    this.user,
    this.permissions,
    this.session,
    this.organizationId,
    this.mustChangePassword,
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
        mfaRequired == other.mfaRequired &&
        mfaToken == other.mfaToken &&
        accessToken == other.accessToken &&
        refreshToken == other.refreshToken &&
        user == other.user &&
        permissions == other.permissions &&
        session == other.session &&
        organizationId == other.organizationId &&
        mustChangePassword == other.mustChangePassword;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, mfaRequired.hashCode);
    _$hash = $jc(_$hash, mfaToken.hashCode);
    _$hash = $jc(_$hash, accessToken.hashCode);
    _$hash = $jc(_$hash, refreshToken.hashCode);
    _$hash = $jc(_$hash, user.hashCode);
    _$hash = $jc(_$hash, permissions.hashCode);
    _$hash = $jc(_$hash, session.hashCode);
    _$hash = $jc(_$hash, organizationId.hashCode);
    _$hash = $jc(_$hash, mustChangePassword.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LoginResponseDto')
          ..add('mfaRequired', mfaRequired)
          ..add('mfaToken', mfaToken)
          ..add('accessToken', accessToken)
          ..add('refreshToken', refreshToken)
          ..add('user', user)
          ..add('permissions', permissions)
          ..add('session', session)
          ..add('organizationId', organizationId)
          ..add('mustChangePassword', mustChangePassword))
        .toString();
  }
}

class LoginResponseDtoBuilder
    implements Builder<LoginResponseDto, LoginResponseDtoBuilder> {
  _$LoginResponseDto? _$v;

  bool? _mfaRequired;
  bool? get mfaRequired => _$this._mfaRequired;
  set mfaRequired(bool? mfaRequired) => _$this._mfaRequired = mfaRequired;

  String? _mfaToken;
  String? get mfaToken => _$this._mfaToken;
  set mfaToken(String? mfaToken) => _$this._mfaToken = mfaToken;

  String? _accessToken;
  String? get accessToken => _$this._accessToken;
  set accessToken(String? accessToken) => _$this._accessToken = accessToken;

  String? _refreshToken;
  String? get refreshToken => _$this._refreshToken;
  set refreshToken(String? refreshToken) => _$this._refreshToken = refreshToken;

  UserDtoBuilder? _user;
  UserDtoBuilder get user => _$this._user ??= UserDtoBuilder();
  set user(UserDtoBuilder? user) => _$this._user = user;

  ListBuilder<String>? _permissions;
  ListBuilder<String> get permissions =>
      _$this._permissions ??= ListBuilder<String>();
  set permissions(ListBuilder<String>? permissions) =>
      _$this._permissions = permissions;

  AuthSessionDtoBuilder? _session;
  AuthSessionDtoBuilder get session =>
      _$this._session ??= AuthSessionDtoBuilder();
  set session(AuthSessionDtoBuilder? session) => _$this._session = session;

  JsonObject? _organizationId;
  JsonObject? get organizationId => _$this._organizationId;
  set organizationId(JsonObject? organizationId) =>
      _$this._organizationId = organizationId;

  bool? _mustChangePassword;
  bool? get mustChangePassword => _$this._mustChangePassword;
  set mustChangePassword(bool? mustChangePassword) =>
      _$this._mustChangePassword = mustChangePassword;

  LoginResponseDtoBuilder() {
    LoginResponseDto._defaults(this);
  }

  LoginResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _mfaRequired = $v.mfaRequired;
      _mfaToken = $v.mfaToken;
      _accessToken = $v.accessToken;
      _refreshToken = $v.refreshToken;
      _user = $v.user?.toBuilder();
      _permissions = $v.permissions?.toBuilder();
      _session = $v.session?.toBuilder();
      _organizationId = $v.organizationId;
      _mustChangePassword = $v.mustChangePassword;
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
            mfaRequired: BuiltValueNullFieldError.checkNotNull(
              mfaRequired,
              r'LoginResponseDto',
              'mfaRequired',
            ),
            mfaToken: mfaToken,
            accessToken: accessToken,
            refreshToken: refreshToken,
            user: _user?.build(),
            permissions: _permissions?.build(),
            session: _session?.build(),
            organizationId: organizationId,
            mustChangePassword: mustChangePassword,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'user';
        _user?.build();
        _$failedField = 'permissions';
        _permissions?.build();
        _$failedField = 'session';
        _session?.build();
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
