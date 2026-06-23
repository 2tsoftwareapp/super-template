// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'audit_controller_export_audit_logs201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuditControllerExportAuditLogs201Response
    extends AuditControllerExportAuditLogs201Response {
  @override
  final AuditExportResultDto data;
  @override
  final RequestMetaDto meta;

  factory _$AuditControllerExportAuditLogs201Response([
    void Function(AuditControllerExportAuditLogs201ResponseBuilder)? updates,
  ]) =>
      (AuditControllerExportAuditLogs201ResponseBuilder()..update(updates))
          ._build();

  _$AuditControllerExportAuditLogs201Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AuditControllerExportAuditLogs201Response rebuild(
    void Function(AuditControllerExportAuditLogs201ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AuditControllerExportAuditLogs201ResponseBuilder toBuilder() =>
      AuditControllerExportAuditLogs201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuditControllerExportAuditLogs201Response &&
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
      r'AuditControllerExportAuditLogs201Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AuditControllerExportAuditLogs201ResponseBuilder
    implements
        Builder<AuditControllerExportAuditLogs201Response,
            AuditControllerExportAuditLogs201ResponseBuilder> {
  _$AuditControllerExportAuditLogs201Response? _$v;

  AuditExportResultDtoBuilder? _data;
  AuditExportResultDtoBuilder get data =>
      _$this._data ??= AuditExportResultDtoBuilder();
  set data(AuditExportResultDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AuditControllerExportAuditLogs201ResponseBuilder() {
    AuditControllerExportAuditLogs201Response._defaults(this);
  }

  AuditControllerExportAuditLogs201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuditControllerExportAuditLogs201Response other) {
    _$v = other as _$AuditControllerExportAuditLogs201Response;
  }

  @override
  void update(
    void Function(AuditControllerExportAuditLogs201ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AuditControllerExportAuditLogs201Response build() => _build();

  _$AuditControllerExportAuditLogs201Response _build() {
    _$AuditControllerExportAuditLogs201Response _$result;
    try {
      _$result = _$v ??
          _$AuditControllerExportAuditLogs201Response._(
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
          r'AuditControllerExportAuditLogs201Response',
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
