// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'export_audit_logs_query_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ExportAuditLogsQueryDto extends ExportAuditLogsQueryDto {
  @override
  final String? actorId;
  @override
  final String? action;
  @override
  final String? resourceType;
  @override
  final String? resourceId;
  @override
  final String? from;
  @override
  final String? to;
  @override
  final String? q;

  factory _$ExportAuditLogsQueryDto([
    void Function(ExportAuditLogsQueryDtoBuilder)? updates,
  ]) =>
      (ExportAuditLogsQueryDtoBuilder()..update(updates))._build();

  _$ExportAuditLogsQueryDto._({
    this.actorId,
    this.action,
    this.resourceType,
    this.resourceId,
    this.from,
    this.to,
    this.q,
  }) : super._();
  @override
  ExportAuditLogsQueryDto rebuild(
    void Function(ExportAuditLogsQueryDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  ExportAuditLogsQueryDtoBuilder toBuilder() =>
      ExportAuditLogsQueryDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ExportAuditLogsQueryDto &&
        actorId == other.actorId &&
        action == other.action &&
        resourceType == other.resourceType &&
        resourceId == other.resourceId &&
        from == other.from &&
        to == other.to &&
        q == other.q;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, actorId.hashCode);
    _$hash = $jc(_$hash, action.hashCode);
    _$hash = $jc(_$hash, resourceType.hashCode);
    _$hash = $jc(_$hash, resourceId.hashCode);
    _$hash = $jc(_$hash, from.hashCode);
    _$hash = $jc(_$hash, to.hashCode);
    _$hash = $jc(_$hash, q.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ExportAuditLogsQueryDto')
          ..add('actorId', actorId)
          ..add('action', action)
          ..add('resourceType', resourceType)
          ..add('resourceId', resourceId)
          ..add('from', from)
          ..add('to', to)
          ..add('q', q))
        .toString();
  }
}

class ExportAuditLogsQueryDtoBuilder
    implements
        Builder<ExportAuditLogsQueryDto, ExportAuditLogsQueryDtoBuilder> {
  _$ExportAuditLogsQueryDto? _$v;

  String? _actorId;
  String? get actorId => _$this._actorId;
  set actorId(String? actorId) => _$this._actorId = actorId;

  String? _action;
  String? get action => _$this._action;
  set action(String? action) => _$this._action = action;

  String? _resourceType;
  String? get resourceType => _$this._resourceType;
  set resourceType(String? resourceType) => _$this._resourceType = resourceType;

  String? _resourceId;
  String? get resourceId => _$this._resourceId;
  set resourceId(String? resourceId) => _$this._resourceId = resourceId;

  String? _from;
  String? get from => _$this._from;
  set from(String? from) => _$this._from = from;

  String? _to;
  String? get to => _$this._to;
  set to(String? to) => _$this._to = to;

  String? _q;
  String? get q => _$this._q;
  set q(String? q) => _$this._q = q;

  ExportAuditLogsQueryDtoBuilder() {
    ExportAuditLogsQueryDto._defaults(this);
  }

  ExportAuditLogsQueryDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _actorId = $v.actorId;
      _action = $v.action;
      _resourceType = $v.resourceType;
      _resourceId = $v.resourceId;
      _from = $v.from;
      _to = $v.to;
      _q = $v.q;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ExportAuditLogsQueryDto other) {
    _$v = other as _$ExportAuditLogsQueryDto;
  }

  @override
  void update(void Function(ExportAuditLogsQueryDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ExportAuditLogsQueryDto build() => _build();

  _$ExportAuditLogsQueryDto _build() {
    final _$result = _$v ??
        _$ExportAuditLogsQueryDto._(
          actorId: actorId,
          action: action,
          resourceType: resourceType,
          resourceId: resourceId,
          from: from,
          to: to,
          q: q,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
