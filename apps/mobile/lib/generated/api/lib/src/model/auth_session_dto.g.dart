// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'auth_session_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuthSessionDto extends AuthSessionDto {
  @override
  final String createdAt;
  @override
  final bool current;
  @override
  final String expiresAt;
  @override
  final String id;
  @override
  final JsonObject? ipAddress;
  @override
  final JsonObject? lastUsedAt;
  @override
  final JsonObject? revokedAt;
  @override
  final String updatedAt;
  @override
  final JsonObject? userAgent;
  @override
  final String userId;

  factory _$AuthSessionDto([void Function(AuthSessionDtoBuilder)? updates]) =>
      (AuthSessionDtoBuilder()..update(updates))._build();

  _$AuthSessionDto._({
    required this.createdAt,
    required this.current,
    required this.expiresAt,
    required this.id,
    this.ipAddress,
    this.lastUsedAt,
    this.revokedAt,
    required this.updatedAt,
    this.userAgent,
    required this.userId,
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
        createdAt == other.createdAt &&
        current == other.current &&
        expiresAt == other.expiresAt &&
        id == other.id &&
        ipAddress == other.ipAddress &&
        lastUsedAt == other.lastUsedAt &&
        revokedAt == other.revokedAt &&
        updatedAt == other.updatedAt &&
        userAgent == other.userAgent &&
        userId == other.userId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, current.hashCode);
    _$hash = $jc(_$hash, expiresAt.hashCode);
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, ipAddress.hashCode);
    _$hash = $jc(_$hash, lastUsedAt.hashCode);
    _$hash = $jc(_$hash, revokedAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jc(_$hash, userAgent.hashCode);
    _$hash = $jc(_$hash, userId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AuthSessionDto')
          ..add('createdAt', createdAt)
          ..add('current', current)
          ..add('expiresAt', expiresAt)
          ..add('id', id)
          ..add('ipAddress', ipAddress)
          ..add('lastUsedAt', lastUsedAt)
          ..add('revokedAt', revokedAt)
          ..add('updatedAt', updatedAt)
          ..add('userAgent', userAgent)
          ..add('userId', userId))
        .toString();
  }
}

class AuthSessionDtoBuilder
    implements Builder<AuthSessionDto, AuthSessionDtoBuilder> {
  _$AuthSessionDto? _$v;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  bool? _current;
  bool? get current => _$this._current;
  set current(bool? current) => _$this._current = current;

  String? _expiresAt;
  String? get expiresAt => _$this._expiresAt;
  set expiresAt(String? expiresAt) => _$this._expiresAt = expiresAt;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  JsonObject? _ipAddress;
  JsonObject? get ipAddress => _$this._ipAddress;
  set ipAddress(JsonObject? ipAddress) => _$this._ipAddress = ipAddress;

  JsonObject? _lastUsedAt;
  JsonObject? get lastUsedAt => _$this._lastUsedAt;
  set lastUsedAt(JsonObject? lastUsedAt) => _$this._lastUsedAt = lastUsedAt;

  JsonObject? _revokedAt;
  JsonObject? get revokedAt => _$this._revokedAt;
  set revokedAt(JsonObject? revokedAt) => _$this._revokedAt = revokedAt;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  JsonObject? _userAgent;
  JsonObject? get userAgent => _$this._userAgent;
  set userAgent(JsonObject? userAgent) => _$this._userAgent = userAgent;

  String? _userId;
  String? get userId => _$this._userId;
  set userId(String? userId) => _$this._userId = userId;

  AuthSessionDtoBuilder() {
    AuthSessionDto._defaults(this);
  }

  AuthSessionDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _createdAt = $v.createdAt;
      _current = $v.current;
      _expiresAt = $v.expiresAt;
      _id = $v.id;
      _ipAddress = $v.ipAddress;
      _lastUsedAt = $v.lastUsedAt;
      _revokedAt = $v.revokedAt;
      _updatedAt = $v.updatedAt;
      _userAgent = $v.userAgent;
      _userId = $v.userId;
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
          createdAt: BuiltValueNullFieldError.checkNotNull(
            createdAt,
            r'AuthSessionDto',
            'createdAt',
          ),
          current: BuiltValueNullFieldError.checkNotNull(
            current,
            r'AuthSessionDto',
            'current',
          ),
          expiresAt: BuiltValueNullFieldError.checkNotNull(
            expiresAt,
            r'AuthSessionDto',
            'expiresAt',
          ),
          id: BuiltValueNullFieldError.checkNotNull(
            id,
            r'AuthSessionDto',
            'id',
          ),
          ipAddress: ipAddress,
          lastUsedAt: lastUsedAt,
          revokedAt: revokedAt,
          updatedAt: BuiltValueNullFieldError.checkNotNull(
            updatedAt,
            r'AuthSessionDto',
            'updatedAt',
          ),
          userAgent: userAgent,
          userId: BuiltValueNullFieldError.checkNotNull(
            userId,
            r'AuthSessionDto',
            'userId',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
