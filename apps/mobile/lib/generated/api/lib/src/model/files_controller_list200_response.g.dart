// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'files_controller_list200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$FilesControllerList200Response extends FilesControllerList200Response {
  @override
  final BuiltList<FileDto> data;
  @override
  final PaginationMetaDto meta;

  factory _$FilesControllerList200Response([
    void Function(FilesControllerList200ResponseBuilder)? updates,
  ]) =>
      (FilesControllerList200ResponseBuilder()..update(updates))._build();

  _$FilesControllerList200Response._({required this.data, required this.meta})
      : super._();
  @override
  FilesControllerList200Response rebuild(
    void Function(FilesControllerList200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  FilesControllerList200ResponseBuilder toBuilder() =>
      FilesControllerList200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is FilesControllerList200Response &&
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
    return (newBuiltValueToStringHelper(r'FilesControllerList200Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class FilesControllerList200ResponseBuilder
    implements
        Builder<FilesControllerList200Response,
            FilesControllerList200ResponseBuilder> {
  _$FilesControllerList200Response? _$v;

  ListBuilder<FileDto>? _data;
  ListBuilder<FileDto> get data => _$this._data ??= ListBuilder<FileDto>();
  set data(ListBuilder<FileDto>? data) => _$this._data = data;

  PaginationMetaDtoBuilder? _meta;
  PaginationMetaDtoBuilder get meta =>
      _$this._meta ??= PaginationMetaDtoBuilder();
  set meta(PaginationMetaDtoBuilder? meta) => _$this._meta = meta;

  FilesControllerList200ResponseBuilder() {
    FilesControllerList200Response._defaults(this);
  }

  FilesControllerList200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(FilesControllerList200Response other) {
    _$v = other as _$FilesControllerList200Response;
  }

  @override
  void update(void Function(FilesControllerList200ResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  FilesControllerList200Response build() => _build();

  _$FilesControllerList200Response _build() {
    _$FilesControllerList200Response _$result;
    try {
      _$result = _$v ??
          _$FilesControllerList200Response._(
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
          r'FilesControllerList200Response',
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
