// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'audit_controller_get_audit_log200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuditControllerGetAuditLog200Response
    extends AuditControllerGetAuditLog200Response {
  @override
  final AuditLogDto data;
  @override
  final RequestMetaDto meta;

  factory _$AuditControllerGetAuditLog200Response([
    void Function(AuditControllerGetAuditLog200ResponseBuilder)? updates,
  ]) =>
      (AuditControllerGetAuditLog200ResponseBuilder()..update(updates))
          ._build();

  _$AuditControllerGetAuditLog200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AuditControllerGetAuditLog200Response rebuild(
    void Function(AuditControllerGetAuditLog200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AuditControllerGetAuditLog200ResponseBuilder toBuilder() =>
      AuditControllerGetAuditLog200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuditControllerGetAuditLog200Response &&
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
      r'AuditControllerGetAuditLog200Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AuditControllerGetAuditLog200ResponseBuilder
    implements
        Builder<AuditControllerGetAuditLog200Response,
            AuditControllerGetAuditLog200ResponseBuilder> {
  _$AuditControllerGetAuditLog200Response? _$v;

  AuditLogDtoBuilder? _data;
  AuditLogDtoBuilder get data => _$this._data ??= AuditLogDtoBuilder();
  set data(AuditLogDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AuditControllerGetAuditLog200ResponseBuilder() {
    AuditControllerGetAuditLog200Response._defaults(this);
  }

  AuditControllerGetAuditLog200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuditControllerGetAuditLog200Response other) {
    _$v = other as _$AuditControllerGetAuditLog200Response;
  }

  @override
  void update(
    void Function(AuditControllerGetAuditLog200ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AuditControllerGetAuditLog200Response build() => _build();

  _$AuditControllerGetAuditLog200Response _build() {
    _$AuditControllerGetAuditLog200Response _$result;
    try {
      _$result = _$v ??
          _$AuditControllerGetAuditLog200Response._(
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
          r'AuditControllerGetAuditLog200Response',
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
