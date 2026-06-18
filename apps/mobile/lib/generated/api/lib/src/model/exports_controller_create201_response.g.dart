// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'exports_controller_create201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ExportsControllerCreate201Response
    extends ExportsControllerCreate201Response {
  @override
  final ExportJobDto data;
  @override
  final RequestMetaDto meta;

  factory _$ExportsControllerCreate201Response([
    void Function(ExportsControllerCreate201ResponseBuilder)? updates,
  ]) =>
      (ExportsControllerCreate201ResponseBuilder()..update(updates))._build();

  _$ExportsControllerCreate201Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  ExportsControllerCreate201Response rebuild(
    void Function(ExportsControllerCreate201ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  ExportsControllerCreate201ResponseBuilder toBuilder() =>
      ExportsControllerCreate201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ExportsControllerCreate201Response &&
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
    return (newBuiltValueToStringHelper(r'ExportsControllerCreate201Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class ExportsControllerCreate201ResponseBuilder
    implements
        Builder<ExportsControllerCreate201Response,
            ExportsControllerCreate201ResponseBuilder> {
  _$ExportsControllerCreate201Response? _$v;

  ExportJobDtoBuilder? _data;
  ExportJobDtoBuilder get data => _$this._data ??= ExportJobDtoBuilder();
  set data(ExportJobDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  ExportsControllerCreate201ResponseBuilder() {
    ExportsControllerCreate201Response._defaults(this);
  }

  ExportsControllerCreate201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ExportsControllerCreate201Response other) {
    _$v = other as _$ExportsControllerCreate201Response;
  }

  @override
  void update(
    void Function(ExportsControllerCreate201ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  ExportsControllerCreate201Response build() => _build();

  _$ExportsControllerCreate201Response _build() {
    _$ExportsControllerCreate201Response _$result;
    try {
      _$result = _$v ??
          _$ExportsControllerCreate201Response._(
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
          r'ExportsControllerCreate201Response',
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
