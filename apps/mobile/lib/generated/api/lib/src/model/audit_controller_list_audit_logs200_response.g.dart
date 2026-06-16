// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'audit_controller_list_audit_logs200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuditControllerListAuditLogs200Response
    extends AuditControllerListAuditLogs200Response {
  @override
  final BuiltList<AuditLogDto> data;
  @override
  final PaginationMetaDto meta;

  factory _$AuditControllerListAuditLogs200Response(
          [void Function(AuditControllerListAuditLogs200ResponseBuilder)?
              updates]) =>
      (AuditControllerListAuditLogs200ResponseBuilder()..update(updates))
          ._build();

  _$AuditControllerListAuditLogs200Response._(
      {required this.data, required this.meta})
      : super._();
  @override
  AuditControllerListAuditLogs200Response rebuild(
          void Function(AuditControllerListAuditLogs200ResponseBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AuditControllerListAuditLogs200ResponseBuilder toBuilder() =>
      AuditControllerListAuditLogs200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuditControllerListAuditLogs200Response &&
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
            r'AuditControllerListAuditLogs200Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AuditControllerListAuditLogs200ResponseBuilder
    implements
        Builder<AuditControllerListAuditLogs200Response,
            AuditControllerListAuditLogs200ResponseBuilder> {
  _$AuditControllerListAuditLogs200Response? _$v;

  ListBuilder<AuditLogDto>? _data;
  ListBuilder<AuditLogDto> get data =>
      _$this._data ??= ListBuilder<AuditLogDto>();
  set data(ListBuilder<AuditLogDto>? data) => _$this._data = data;

  PaginationMetaDtoBuilder? _meta;
  PaginationMetaDtoBuilder get meta =>
      _$this._meta ??= PaginationMetaDtoBuilder();
  set meta(PaginationMetaDtoBuilder? meta) => _$this._meta = meta;

  AuditControllerListAuditLogs200ResponseBuilder() {
    AuditControllerListAuditLogs200Response._defaults(this);
  }

  AuditControllerListAuditLogs200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuditControllerListAuditLogs200Response other) {
    _$v = other as _$AuditControllerListAuditLogs200Response;
  }

  @override
  void update(
      void Function(AuditControllerListAuditLogs200ResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AuditControllerListAuditLogs200Response build() => _build();

  _$AuditControllerListAuditLogs200Response _build() {
    _$AuditControllerListAuditLogs200Response _$result;
    try {
      _$result = _$v ??
          _$AuditControllerListAuditLogs200Response._(
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
            r'AuditControllerListAuditLogs200Response',
            _$failedField,
            e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
