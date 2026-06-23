// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'files_controller_get_history200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$FilesControllerGetHistory200Response
    extends FilesControllerGetHistory200Response {
  @override
  final BuiltList<FileHistoryEventDto> data;
  @override
  final RequestMetaDto meta;

  factory _$FilesControllerGetHistory200Response([
    void Function(FilesControllerGetHistory200ResponseBuilder)? updates,
  ]) =>
      (FilesControllerGetHistory200ResponseBuilder()..update(updates))._build();

  _$FilesControllerGetHistory200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  FilesControllerGetHistory200Response rebuild(
    void Function(FilesControllerGetHistory200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  FilesControllerGetHistory200ResponseBuilder toBuilder() =>
      FilesControllerGetHistory200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is FilesControllerGetHistory200Response &&
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
    return (newBuiltValueToStringHelper(r'FilesControllerGetHistory200Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class FilesControllerGetHistory200ResponseBuilder
    implements
        Builder<FilesControllerGetHistory200Response,
            FilesControllerGetHistory200ResponseBuilder> {
  _$FilesControllerGetHistory200Response? _$v;

  ListBuilder<FileHistoryEventDto>? _data;
  ListBuilder<FileHistoryEventDto> get data =>
      _$this._data ??= ListBuilder<FileHistoryEventDto>();
  set data(ListBuilder<FileHistoryEventDto>? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  FilesControllerGetHistory200ResponseBuilder() {
    FilesControllerGetHistory200Response._defaults(this);
  }

  FilesControllerGetHistory200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(FilesControllerGetHistory200Response other) {
    _$v = other as _$FilesControllerGetHistory200Response;
  }

  @override
  void update(
    void Function(FilesControllerGetHistory200ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  FilesControllerGetHistory200Response build() => _build();

  _$FilesControllerGetHistory200Response _build() {
    _$FilesControllerGetHistory200Response _$result;
    try {
      _$result = _$v ??
          _$FilesControllerGetHistory200Response._(
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
          r'FilesControllerGetHistory200Response',
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
