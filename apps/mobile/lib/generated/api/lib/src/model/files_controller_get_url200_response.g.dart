// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'files_controller_get_url200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$FilesControllerGetUrl200Response
    extends FilesControllerGetUrl200Response {
  @override
  final FileUrlDto data;
  @override
  final RequestMetaDto meta;

  factory _$FilesControllerGetUrl200Response([
    void Function(FilesControllerGetUrl200ResponseBuilder)? updates,
  ]) =>
      (FilesControllerGetUrl200ResponseBuilder()..update(updates))._build();

  _$FilesControllerGetUrl200Response._({required this.data, required this.meta})
      : super._();
  @override
  FilesControllerGetUrl200Response rebuild(
    void Function(FilesControllerGetUrl200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  FilesControllerGetUrl200ResponseBuilder toBuilder() =>
      FilesControllerGetUrl200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is FilesControllerGetUrl200Response &&
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
    return (newBuiltValueToStringHelper(r'FilesControllerGetUrl200Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class FilesControllerGetUrl200ResponseBuilder
    implements
        Builder<FilesControllerGetUrl200Response,
            FilesControllerGetUrl200ResponseBuilder> {
  _$FilesControllerGetUrl200Response? _$v;

  FileUrlDtoBuilder? _data;
  FileUrlDtoBuilder get data => _$this._data ??= FileUrlDtoBuilder();
  set data(FileUrlDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  FilesControllerGetUrl200ResponseBuilder() {
    FilesControllerGetUrl200Response._defaults(this);
  }

  FilesControllerGetUrl200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(FilesControllerGetUrl200Response other) {
    _$v = other as _$FilesControllerGetUrl200Response;
  }

  @override
  void update(void Function(FilesControllerGetUrl200ResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  FilesControllerGetUrl200Response build() => _build();

  _$FilesControllerGetUrl200Response _build() {
    _$FilesControllerGetUrl200Response _$result;
    try {
      _$result = _$v ??
          _$FilesControllerGetUrl200Response._(
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
          r'FilesControllerGetUrl200Response',
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
