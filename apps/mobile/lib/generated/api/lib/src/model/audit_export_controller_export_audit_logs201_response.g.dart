// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'audit_export_controller_export_audit_logs201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuditExportControllerExportAuditLogs201Response
    extends AuditExportControllerExportAuditLogs201Response {
  @override
  final AuditExportResultDto data;
  @override
  final RequestMetaDto meta;

  factory _$AuditExportControllerExportAuditLogs201Response([
    void Function(AuditExportControllerExportAuditLogs201ResponseBuilder)?
        updates,
  ]) =>
      (AuditExportControllerExportAuditLogs201ResponseBuilder()
            ..update(updates))
          ._build();

  _$AuditExportControllerExportAuditLogs201Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AuditExportControllerExportAuditLogs201Response rebuild(
    void Function(AuditExportControllerExportAuditLogs201ResponseBuilder)
        updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AuditExportControllerExportAuditLogs201ResponseBuilder toBuilder() =>
      AuditExportControllerExportAuditLogs201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuditExportControllerExportAuditLogs201Response &&
        data == other.data &&
        meta == other.meta;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, data.hashCode);
    _$hash = $jc(_$hash, meta.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'AuditExportControllerExportAuditLogs201Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AuditExportControllerExportAuditLogs201ResponseBuilder
    implements
        Builder<AuditExportControllerExportAuditLogs201Response,
            AuditExportControllerExportAuditLogs201ResponseBuilder> {
  _$AuditExportControllerExportAuditLogs201Response? _$v;

  AuditExportResultDtoBuilder? _data;
  AuditExportResultDtoBuilder get data =>
      _$this._data ??= AuditExportResultDtoBuilder();
  set data(AuditExportResultDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AuditExportControllerExportAuditLogs201ResponseBuilder() {
    AuditExportControllerExportAuditLogs201Response._defaults(this);
  }

  AuditExportControllerExportAuditLogs201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuditExportControllerExportAuditLogs201Response other) {
    _$v = other as _$AuditExportControllerExportAuditLogs201Response;
  }

  @override
  void update(
    void Function(AuditExportControllerExportAuditLogs201ResponseBuilder)?
        updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AuditExportControllerExportAuditLogs201Response build() => _build();

  _$AuditExportControllerExportAuditLogs201Response _build() {
    _$AuditExportControllerExportAuditLogs201Response _$result;
    try {
      _$result = _$v ??
          _$AuditExportControllerExportAuditLogs201Response._(
            data: data.build(),
            meta: meta.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
        _$failedField = 'meta';
        meta.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'AuditExportControllerExportAuditLogs201Response',
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
