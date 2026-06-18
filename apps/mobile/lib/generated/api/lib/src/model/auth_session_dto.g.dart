// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'auth_session_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuthSessionDto extends AuthSessionDto {
  @override
  final String id;
  @override
  final String userId;
  @override
  final String expiresAt;
  @override
  final JsonObject? revokedAt;
  @override
  final JsonObject? lastUsedAt;
  @override
  final JsonObject? ipAddress;
  @override
  final JsonObject? userAgent;
  @override
  final String createdAt;
  @override
  final String updatedAt;
  @override
  final bool current;

  factory _$AuthSessionDto([void Function(AuthSessionDtoBuilder)? updates]) =>
      (AuthSessionDtoBuilder()..update(updates))._build();

  _$AuthSessionDto._({
    required this.id,
    required this.userId,
    required this.expiresAt,
    this.revokedAt,
    this.lastUsedAt,
    this.ipAddress,
    this.userAgent,
    required this.createdAt,
    required this.updatedAt,
    required this.current,
  }) : super._();
  @override
  AuthSessionDto rebuild(void Function(AuthSessionDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AuthSessionDtoBuilder toBuilder() => AuthSessionDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuthSessionDto &&
        id == other.id &&
        userId == other.userId &&
        expiresAt == other.expiresAt &&
        revokedAt == other.revokedAt &&
        lastUsedAt == other.lastUsedAt &&
        ipAddress == other.ipAddress &&
        userAgent == other.userAgent &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt &&
        current == other.current;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, userId.hashCode);
    _$hash = $jc(_$hash, expiresAt.hashCode);
    _$hash = $jc(_$hash, revokedAt.hashCode);
    _$hash = $jc(_$hash, lastUsedAt.hashCode);
    _$hash = $jc(_$hash, ipAddress.hashCode);
    _$hash = $jc(_$hash, userAgent.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jc(_$hash, current.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AuthSessionDto')
          ..add('id', id)
          ..add('userId', userId)
          ..add('expiresAt', expiresAt)
          ..add('revokedAt', revokedAt)
          ..add('lastUsedAt', lastUsedAt)
          ..add('ipAddress', ipAddress)
          ..add('userAgent', userAgent)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt)
          ..add('current', current))
        .toString();
  }
}

class AuthSessionDtoBuilder
    implements Builder<AuthSessionDto, AuthSessionDtoBuilder> {
  _$AuthSessionDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _userId;
  String? get userId => _$this._userId;
  set userId(String? userId) => _$this._userId = userId;

  String? _expiresAt;
  String? get expiresAt => _$this._expiresAt;
  set expiresAt(String? expiresAt) => _$this._expiresAt = expiresAt;

  JsonObject? _revokedAt;
  JsonObject? get revokedAt => _$this._revokedAt;
  set revokedAt(JsonObject? revokedAt) => _$this._revokedAt = revokedAt;

  JsonObject? _lastUsedAt;
  JsonObject? get lastUsedAt => _$this._lastUsedAt;
  set lastUsedAt(JsonObject? lastUsedAt) => _$this._lastUsedAt = lastUsedAt;

  JsonObject? _ipAddress;
  JsonObject? get ipAddress => _$this._ipAddress;
  set ipAddress(JsonObject? ipAddress) => _$this._ipAddress = ipAddress;

  JsonObject? _userAgent;
  JsonObject? get userAgent => _$this._userAgent;
  set userAgent(JsonObject? userAgent) => _$this._userAgent = userAgent;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  bool? _current;
  bool? get current => _$this._current;
  set current(bool? current) => _$this._current = current;

  AuthSessionDtoBuilder() {
    AuthSessionDto._defaults(this);
  }

  AuthSessionDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _userId = $v.userId;
      _expiresAt = $v.expiresAt;
      _revokedAt = $v.revokedAt;
      _lastUsedAt = $v.lastUsedAt;
      _ipAddress = $v.ipAddress;
      _userAgent = $v.userAgent;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _current = $v.current;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuthSessionDto other) {
    _$v = other as _$AuthSessionDto;
  }

  @override
  void update(void Function(AuthSessionDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AuthSessionDto build() => _build();

  _$AuthSessionDto _build() {
    final _$result = _$v ??
        _$AuthSessionDto._(
          id: BuiltValueNullFieldError.checkNotNull(
            id,
            r'AuthSessionDto',
            'id',
          ),
          userId: BuiltValueNullFieldError.checkNotNull(
            userId,
            r'AuthSessionDto',
            'userId',
          ),
          expiresAt: BuiltValueNullFieldError.checkNotNull(
            expiresAt,
            r'AuthSessionDto',
            'expiresAt',
          ),
          revokedAt: revokedAt,
          lastUsedAt: lastUsedAt,
          ipAddress: ipAddress,
          userAgent: userAgent,
          createdAt: BuiltValueNullFieldError.checkNotNull(
            createdAt,
            r'AuthSessionDto',
            'createdAt',
          ),
          updatedAt: BuiltValueNullFieldError.checkNotNull(
            updatedAt,
            r'AuthSessionDto',
            'updatedAt',
          ),
          current: BuiltValueNullFieldError.checkNotNull(
            current,
            r'AuthSessionDto',
            'current',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
