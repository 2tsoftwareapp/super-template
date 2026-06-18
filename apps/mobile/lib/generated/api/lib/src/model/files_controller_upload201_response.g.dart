// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'files_controller_upload201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$FilesControllerUpload201Response
    extends FilesControllerUpload201Response {
  @override
  final FileDto data;
  @override
  final RequestMetaDto meta;

  factory _$FilesControllerUpload201Response([
    void Function(FilesControllerUpload201ResponseBuilder)? updates,
  ]) =>
      (FilesControllerUpload201ResponseBuilder()..update(updates))._build();

  _$FilesControllerUpload201Response._({required this.data, required this.meta})
      : super._();
  @override
  FilesControllerUpload201Response rebuild(
    void Function(FilesControllerUpload201ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  FilesControllerUpload201ResponseBuilder toBuilder() =>
      FilesControllerUpload201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is FilesControllerUpload201Response &&
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
    return (newBuiltValueToStringHelper(r'FilesControllerUpload201Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class FilesControllerUpload201ResponseBuilder
    implements
        Builder<FilesControllerUpload201Response,
            FilesControllerUpload201ResponseBuilder> {
  _$FilesControllerUpload201Response? _$v;

  FileDtoBuilder? _data;
  FileDtoBuilder get data => _$this._data ??= FileDtoBuilder();
  set data(FileDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  FilesControllerUpload201ResponseBuilder() {
    FilesControllerUpload201Response._defaults(this);
  }

  FilesControllerUpload201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(FilesControllerUpload201Response other) {
    _$v = other as _$FilesControllerUpload201Response;
  }

  @override
  void update(void Function(FilesControllerUpload201ResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  FilesControllerUpload201Response build() => _build();

  _$FilesControllerUpload201Response _build() {
    _$FilesControllerUpload201Response _$result;
    try {
      _$result = _$v ??
          _$FilesControllerUpload201Response._(
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
          r'FilesControllerUpload201Response',
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
