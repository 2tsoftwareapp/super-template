// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'export_audit_logs_query_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ExportAuditLogsQueryDto extends ExportAuditLogsQueryDto {
  @override
  final String? action;
  @override
  final String? actorId;
  @override
  final DateTime? from;
  @override
  final String? resourceId;
  @override
  final String? resourceType;
  @override
  final DateTime? to;

  factory _$ExportAuditLogsQueryDto([
    void Function(ExportAuditLogsQueryDtoBuilder)? updates,
  ]) =>
      (ExportAuditLogsQueryDtoBuilder()..update(updates))._build();

  _$ExportAuditLogsQueryDto._({
    this.action,
    this.actorId,
    this.from,
    this.resourceId,
    this.resourceType,
    this.to,
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
        action == other.action &&
        actorId == other.actorId &&
        from == other.from &&
        resourceId == other.resourceId &&
        resourceType == other.resourceType &&
        to == other.to;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, action.hashCode);
    _$hash = $jc(_$hash, actorId.hashCode);
    _$hash = $jc(_$hash, from.hashCode);
    _$hash = $jc(_$hash, resourceId.hashCode);
    _$hash = $jc(_$hash, resourceType.hashCode);
    _$hash = $jc(_$hash, to.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ExportAuditLogsQueryDto')
          ..add('action', action)
          ..add('actorId', actorId)
          ..add('from', from)
          ..add('resourceId', resourceId)
          ..add('resourceType', resourceType)
          ..add('to', to))
        .toString();
  }
}

class ExportAuditLogsQueryDtoBuilder
    implements
        Builder<ExportAuditLogsQueryDto, ExportAuditLogsQueryDtoBuilder> {
  _$ExportAuditLogsQueryDto? _$v;

  String? _action;
  String? get action => _$this._action;
  set action(String? action) => _$this._action = action;

  String? _actorId;
  String? get actorId => _$this._actorId;
  set actorId(String? actorId) => _$this._actorId = actorId;

  DateTime? _from;
  DateTime? get from => _$this._from;
  set from(DateTime? from) => _$this._from = from;

  String? _resourceId;
  String? get resourceId => _$this._resourceId;
  set resourceId(String? resourceId) => _$this._resourceId = resourceId;

  String? _resourceType;
  String? get resourceType => _$this._resourceType;
  set resourceType(String? resourceType) => _$this._resourceType = resourceType;

  DateTime? _to;
  DateTime? get to => _$this._to;
  set to(DateTime? to) => _$this._to = to;

  ExportAuditLogsQueryDtoBuilder() {
    ExportAuditLogsQueryDto._defaults(this);
  }

  ExportAuditLogsQueryDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _action = $v.action;
      _actorId = $v.actorId;
      _from = $v.from;
      _resourceId = $v.resourceId;
      _resourceType = $v.resourceType;
      _to = $v.to;
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
          action: action,
          actorId: actorId,
          from: from,
          resourceId: resourceId,
          resourceType: resourceType,
          to: to,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
