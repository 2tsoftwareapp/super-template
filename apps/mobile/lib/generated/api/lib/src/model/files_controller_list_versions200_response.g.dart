// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'files_controller_list_versions200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$FilesControllerListVersions200Response
    extends FilesControllerListVersions200Response {
  @override
  final BuiltList<FileVersionDto> data;
  @override
  final RequestMetaDto meta;

  factory _$FilesControllerListVersions200Response([
    void Function(FilesControllerListVersions200ResponseBuilder)? updates,
  ]) =>
      (FilesControllerListVersions200ResponseBuilder()..update(updates))
          ._build();

  _$FilesControllerListVersions200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  FilesControllerListVersions200Response rebuild(
    void Function(FilesControllerListVersions200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  FilesControllerListVersions200ResponseBuilder toBuilder() =>
      FilesControllerListVersions200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is FilesControllerListVersions200Response &&
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
      r'FilesControllerListVersions200Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class FilesControllerListVersions200ResponseBuilder
    implements
        Builder<FilesControllerListVersions200Response,
            FilesControllerListVersions200ResponseBuilder> {
  _$FilesControllerListVersions200Response? _$v;

  ListBuilder<FileVersionDto>? _data;
  ListBuilder<FileVersionDto> get data =>
      _$this._data ??= ListBuilder<FileVersionDto>();
  set data(ListBuilder<FileVersionDto>? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  FilesControllerListVersions200ResponseBuilder() {
    FilesControllerListVersions200Response._defaults(this);
  }

  FilesControllerListVersions200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(FilesControllerListVersions200Response other) {
    _$v = other as _$FilesControllerListVersions200Response;
  }

  @override
  void update(
    void Function(FilesControllerListVersions200ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  FilesControllerListVersions200Response build() => _build();

  _$FilesControllerListVersions200Response _build() {
    _$FilesControllerListVersions200Response _$result;
    try {
      _$result = _$v ??
          _$FilesControllerListVersions200Response._(
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
          r'FilesControllerListVersions200Response',
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
