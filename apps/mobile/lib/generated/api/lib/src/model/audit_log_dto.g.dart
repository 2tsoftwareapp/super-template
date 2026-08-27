// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'audit_log_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuditLogDto extends AuditLogDto {
  @override
  final String action;
  @override
  final String? actorId;
  @override
  final String createdAt;
  @override
  final String? entityId;
  @override
  final String entityType;
  @override
  final String id;
  @override
  final String? ipAddress;
  @override
  final BuiltMap<String, JsonObject?>? metadata;
  @override
  final String? organizationId;
  @override
  final String? requestId;
  @override
  final String? userAgent;

  factory _$AuditLogDto([void Function(AuditLogDtoBuilder)? updates]) =>
      (AuditLogDtoBuilder()..update(updates))._build();

  _$AuditLogDto._({
    required this.action,
    this.actorId,
    required this.createdAt,
    this.entityId,
    required this.entityType,
    required this.id,
    this.ipAddress,
    this.metadata,
    this.organizationId,
    this.requestId,
    this.userAgent,
  }) : super._();
  @override
  AuditLogDto rebuild(void Function(AuditLogDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AuditLogDtoBuilder toBuilder() => AuditLogDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuditLogDto &&
        action == other.action &&
        actorId == other.actorId &&
        createdAt == other.createdAt &&
        entityId == other.entityId &&
        entityType == other.entityType &&
        id == other.id &&
        ipAddress == other.ipAddress &&
        metadata == other.metadata &&
        organizationId == other.organizationId &&
        requestId == other.requestId &&
        userAgent == other.userAgent;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, action.hashCode);
    _$hash = $jc(_$hash, actorId.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, entityId.hashCode);
    _$hash = $jc(_$hash, entityType.hashCode);
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, ipAddress.hashCode);
    _$hash = $jc(_$hash, metadata.hashCode);
    _$hash = $jc(_$hash, organizationId.hashCode);
    _$hash = $jc(_$hash, requestId.hashCode);
    _$hash = $jc(_$hash, userAgent.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AuditLogDto')
          ..add('action', action)
          ..add('actorId', actorId)
          ..add('createdAt', createdAt)
          ..add('entityId', entityId)
          ..add('entityType', entityType)
          ..add('id', id)
          ..add('ipAddress', ipAddress)
          ..add('metadata', metadata)
          ..add('organizationId', organizationId)
          ..add('requestId', requestId)
          ..add('userAgent', userAgent))
        .toString();
  }
}

class AuditLogDtoBuilder implements Builder<AuditLogDto, AuditLogDtoBuilder> {
  _$AuditLogDto? _$v;

  String? _action;
  String? get action => _$this._action;
  set action(String? action) => _$this._action = action;

  String? _actorId;
  String? get actorId => _$this._actorId;
  set actorId(String? actorId) => _$this._actorId = actorId;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _entityId;
  String? get entityId => _$this._entityId;
  set entityId(String? entityId) => _$this._entityId = entityId;

  String? _entityType;
  String? get entityType => _$this._entityType;
  set entityType(String? entityType) => _$this._entityType = entityType;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _ipAddress;
  String? get ipAddress => _$this._ipAddress;
  set ipAddress(String? ipAddress) => _$this._ipAddress = ipAddress;

  MapBuilder<String, JsonObject?>? _metadata;
  MapBuilder<String, JsonObject?> get metadata =>
      _$this._metadata ??= MapBuilder<String, JsonObject?>();
  set metadata(MapBuilder<String, JsonObject?>? metadata) =>
      _$this._metadata = metadata;

  String? _organizationId;
  String? get organizationId => _$this._organizationId;
  set organizationId(String? organizationId) =>
      _$this._organizationId = organizationId;

  String? _requestId;
  String? get requestId => _$this._requestId;
  set requestId(String? requestId) => _$this._requestId = requestId;

  String? _userAgent;
  String? get userAgent => _$this._userAgent;
  set userAgent(String? userAgent) => _$this._userAgent = userAgent;

  AuditLogDtoBuilder() {
    AuditLogDto._defaults(this);
  }

  AuditLogDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _action = $v.action;
      _actorId = $v.actorId;
      _createdAt = $v.createdAt;
      _entityId = $v.entityId;
      _entityType = $v.entityType;
      _id = $v.id;
      _ipAddress = $v.ipAddress;
      _metadata = $v.metadata?.toBuilder();
      _organizationId = $v.organizationId;
      _requestId = $v.requestId;
      _userAgent = $v.userAgent;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuditLogDto other) {
    _$v = other as _$AuditLogDto;
  }

  @override
  void update(void Function(AuditLogDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AuditLogDto build() => _build();

  _$AuditLogDto _build() {
    _$AuditLogDto _$result;
    try {
      _$result = _$v ??
          _$AuditLogDto._(
            action: BuiltValueNullFieldError.checkNotNull(
              action,
              r'AuditLogDto',
              'action',
            ),
            actorId: actorId,
            createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt,
              r'AuditLogDto',
              'createdAt',
            ),
            entityId: entityId,
            entityType: BuiltValueNullFieldError.checkNotNull(
              entityType,
              r'AuditLogDto',
              'entityType',
            ),
            id: BuiltValueNullFieldError.checkNotNull(id, r'AuditLogDto', 'id'),
            ipAddress: ipAddress,
            metadata: _metadata?.build(),
            organizationId: organizationId,
            requestId: requestId,
            userAgent: userAgent,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'metadata';
        _metadata?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'AuditLogDto',
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
