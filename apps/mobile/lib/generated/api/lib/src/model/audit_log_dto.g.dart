// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'audit_log_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuditLogDto extends AuditLogDto {
  @override
  final String id;
  @override
  final JsonObject? actorId;
  @override
  final String action;
  @override
  final String entityType;
  @override
  final JsonObject? entityId;
  @override
  final BuiltMap<String, JsonObject?>? metadata;
  @override
  final JsonObject? ipAddress;
  @override
  final JsonObject? userAgent;
  @override
  final JsonObject? requestId;
  @override
  final String createdAt;

  factory _$AuditLogDto([void Function(AuditLogDtoBuilder)? updates]) =>
      (AuditLogDtoBuilder()..update(updates))._build();

  _$AuditLogDto._(
      {required this.id,
      this.actorId,
      required this.action,
      required this.entityType,
      this.entityId,
      this.metadata,
      this.ipAddress,
      this.userAgent,
      this.requestId,
      required this.createdAt})
      : super._();
  @override
  AuditLogDto rebuild(void Function(AuditLogDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AuditLogDtoBuilder toBuilder() => AuditLogDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuditLogDto &&
        id == other.id &&
        actorId == other.actorId &&
        action == other.action &&
        entityType == other.entityType &&
        entityId == other.entityId &&
        metadata == other.metadata &&
        ipAddress == other.ipAddress &&
        userAgent == other.userAgent &&
        requestId == other.requestId &&
        createdAt == other.createdAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, actorId.hashCode);
    _$hash = $jc(_$hash, action.hashCode);
    _$hash = $jc(_$hash, entityType.hashCode);
    _$hash = $jc(_$hash, entityId.hashCode);
    _$hash = $jc(_$hash, metadata.hashCode);
    _$hash = $jc(_$hash, ipAddress.hashCode);
    _$hash = $jc(_$hash, userAgent.hashCode);
    _$hash = $jc(_$hash, requestId.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AuditLogDto')
          ..add('id', id)
          ..add('actorId', actorId)
          ..add('action', action)
          ..add('entityType', entityType)
          ..add('entityId', entityId)
          ..add('metadata', metadata)
          ..add('ipAddress', ipAddress)
          ..add('userAgent', userAgent)
          ..add('requestId', requestId)
          ..add('createdAt', createdAt))
        .toString();
  }
}

class AuditLogDtoBuilder implements Builder<AuditLogDto, AuditLogDtoBuilder> {
  _$AuditLogDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  JsonObject? _actorId;
  JsonObject? get actorId => _$this._actorId;
  set actorId(JsonObject? actorId) => _$this._actorId = actorId;

  String? _action;
  String? get action => _$this._action;
  set action(String? action) => _$this._action = action;

  String? _entityType;
  String? get entityType => _$this._entityType;
  set entityType(String? entityType) => _$this._entityType = entityType;

  JsonObject? _entityId;
  JsonObject? get entityId => _$this._entityId;
  set entityId(JsonObject? entityId) => _$this._entityId = entityId;

  MapBuilder<String, JsonObject?>? _metadata;
  MapBuilder<String, JsonObject?> get metadata =>
      _$this._metadata ??= MapBuilder<String, JsonObject?>();
  set metadata(MapBuilder<String, JsonObject?>? metadata) =>
      _$this._metadata = metadata;

  JsonObject? _ipAddress;
  JsonObject? get ipAddress => _$this._ipAddress;
  set ipAddress(JsonObject? ipAddress) => _$this._ipAddress = ipAddress;

  JsonObject? _userAgent;
  JsonObject? get userAgent => _$this._userAgent;
  set userAgent(JsonObject? userAgent) => _$this._userAgent = userAgent;

  JsonObject? _requestId;
  JsonObject? get requestId => _$this._requestId;
  set requestId(JsonObject? requestId) => _$this._requestId = requestId;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  AuditLogDtoBuilder() {
    AuditLogDto._defaults(this);
  }

  AuditLogDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _actorId = $v.actorId;
      _action = $v.action;
      _entityType = $v.entityType;
      _entityId = $v.entityId;
      _metadata = $v.metadata?.toBuilder();
      _ipAddress = $v.ipAddress;
      _userAgent = $v.userAgent;
      _requestId = $v.requestId;
      _createdAt = $v.createdAt;
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
            id: BuiltValueNullFieldError.checkNotNull(id, r'AuditLogDto', 'id'),
            actorId: actorId,
            action: BuiltValueNullFieldError.checkNotNull(
                action, r'AuditLogDto', 'action'),
            entityType: BuiltValueNullFieldError.checkNotNull(
                entityType, r'AuditLogDto', 'entityType'),
            entityId: entityId,
            metadata: _metadata?.build(),
            ipAddress: ipAddress,
            userAgent: userAgent,
            requestId: requestId,
            createdAt: BuiltValueNullFieldError.checkNotNull(
                createdAt, r'AuditLogDto', 'createdAt'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'metadata';
        _metadata?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'AuditLogDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
