// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'files_controller_batch_delete201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$FilesControllerBatchDelete201Response
    extends FilesControllerBatchDelete201Response {
  @override
  final BatchDeleteResultDto data;
  @override
  final RequestMetaDto meta;

  factory _$FilesControllerBatchDelete201Response([
    void Function(FilesControllerBatchDelete201ResponseBuilder)? updates,
  ]) =>
      (FilesControllerBatchDelete201ResponseBuilder()..update(updates))
          ._build();

  _$FilesControllerBatchDelete201Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  FilesControllerBatchDelete201Response rebuild(
    void Function(FilesControllerBatchDelete201ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  FilesControllerBatchDelete201ResponseBuilder toBuilder() =>
      FilesControllerBatchDelete201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is FilesControllerBatchDelete201Response &&
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
      r'FilesControllerBatchDelete201Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class FilesControllerBatchDelete201ResponseBuilder
    implements
        Builder<FilesControllerBatchDelete201Response,
            FilesControllerBatchDelete201ResponseBuilder> {
  _$FilesControllerBatchDelete201Response? _$v;

  BatchDeleteResultDtoBuilder? _data;
  BatchDeleteResultDtoBuilder get data =>
      _$this._data ??= BatchDeleteResultDtoBuilder();
  set data(BatchDeleteResultDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  FilesControllerBatchDelete201ResponseBuilder() {
    FilesControllerBatchDelete201Response._defaults(this);
  }

  FilesControllerBatchDelete201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(FilesControllerBatchDelete201Response other) {
    _$v = other as _$FilesControllerBatchDelete201Response;
  }

  @override
  void update(
    void Function(FilesControllerBatchDelete201ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  FilesControllerBatchDelete201Response build() => _build();

  _$FilesControllerBatchDelete201Response _build() {
    _$FilesControllerBatchDelete201Response _$result;
    try {
      _$result = _$v ??
          _$FilesControllerBatchDelete201Response._(
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
          r'FilesControllerBatchDelete201Response',
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
