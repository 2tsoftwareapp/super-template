// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'auth_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuthResponseDto extends AuthResponseDto {
  @override
  final String accessToken;
  @override
  final bool? mustChangePassword;
  @override
  final String? organizationId;
  @override
  final BuiltList<String> permissions;
  @override
  final String refreshToken;
  @override
  final AuthSessionDto session;
  @override
  final AuthUserDto user;

  factory _$AuthResponseDto([void Function(AuthResponseDtoBuilder)? updates]) =>
      (AuthResponseDtoBuilder()..update(updates))._build();

  _$AuthResponseDto._({
    required this.accessToken,
    this.mustChangePassword,
    this.organizationId,
    required this.permissions,
    required this.refreshToken,
    required this.session,
    required this.user,
  }) : super._();
  @override
  AuthResponseDto rebuild(void Function(AuthResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AuthResponseDtoBuilder toBuilder() => AuthResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuthResponseDto &&
        accessToken == other.accessToken &&
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
    return (newBuiltValueToStringHelper(r'AuthResponseDto')
          ..add('accessToken', accessToken)
          ..add('mustChangePassword', mustChangePassword)
          ..add('organizationId', organizationId)
          ..add('permissions', permissions)
          ..add('refreshToken', refreshToken)
          ..add('session', session)
          ..add('user', user))
        .toString();
  }
}

class AuthResponseDtoBuilder
    implements Builder<AuthResponseDto, AuthResponseDtoBuilder> {
  _$AuthResponseDto? _$v;

  String? _accessToken;
  String? get accessToken => _$this._accessToken;
  set accessToken(String? accessToken) => _$this._accessToken = accessToken;

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

  AuthResponseDtoBuilder() {
    AuthResponseDto._defaults(this);
  }

  AuthResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _accessToken = $v.accessToken;
      _mustChangePassword = $v.mustChangePassword;
      _organizationId = $v.organizationId;
      _permissions = $v.permissions.toBuilder();
      _refreshToken = $v.refreshToken;
      _session = $v.session.toBuilder();
      _user = $v.user.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuthResponseDto other) {
    _$v = other as _$AuthResponseDto;
  }

  @override
  void update(void Function(AuthResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AuthResponseDto build() => _build();

  _$AuthResponseDto _build() {
    _$AuthResponseDto _$result;
    try {
      _$result = _$v ??
          _$AuthResponseDto._(
            accessToken: BuiltValueNullFieldError.checkNotNull(
              accessToken,
              r'AuthResponseDto',
              'accessToken',
            ),
            mustChangePassword: mustChangePassword,
            organizationId: organizationId,
            permissions: permissions.build(),
            refreshToken: BuiltValueNullFieldError.checkNotNull(
              refreshToken,
              r'AuthResponseDto',
              'refreshToken',
            ),
            session: session.build(),
            user: user.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'permissions';
        permissions.build();

        _$failedField = 'session';
        session.build();
        _$failedField = 'user';
        user.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'AuthResponseDto',
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
