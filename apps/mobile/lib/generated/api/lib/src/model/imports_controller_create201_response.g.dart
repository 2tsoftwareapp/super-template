// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'imports_controller_create201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ImportsControllerCreate201Response
    extends ImportsControllerCreate201Response {
  @override
  final ImportJobDto data;
  @override
  final RequestMetaDto meta;

  factory _$ImportsControllerCreate201Response(
          [void Function(ImportsControllerCreate201ResponseBuilder)?
              updates]) =>
      (ImportsControllerCreate201ResponseBuilder()..update(updates))._build();

  _$ImportsControllerCreate201Response._(
      {required this.data, required this.meta})
      : super._();
  @override
  ImportsControllerCreate201Response rebuild(
          void Function(ImportsControllerCreate201ResponseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ImportsControllerCreate201ResponseBuilder toBuilder() =>
      ImportsControllerCreate201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ImportsControllerCreate201Response &&
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
    return (newBuiltValueToStringHelper(r'ImportsControllerCreate201Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class ImportsControllerCreate201ResponseBuilder
    implements
        Builder<ImportsControllerCreate201Response,
            ImportsControllerCreate201ResponseBuilder> {
  _$ImportsControllerCreate201Response? _$v;

  ImportJobDtoBuilder? _data;
  ImportJobDtoBuilder get data => _$this._data ??= ImportJobDtoBuilder();
  set data(ImportJobDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  ImportsControllerCreate201ResponseBuilder() {
    ImportsControllerCreate201Response._defaults(this);
  }

  ImportsControllerCreate201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ImportsControllerCreate201Response other) {
    _$v = other as _$ImportsControllerCreate201Response;
  }

  @override
  void update(
      void Function(ImportsControllerCreate201ResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ImportsControllerCreate201Response build() => _build();

  _$ImportsControllerCreate201Response _build() {
    _$ImportsControllerCreate201Response _$result;
    try {
      _$result = _$v ??
          _$ImportsControllerCreate201Response._(
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
            r'ImportsControllerCreate201Response', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
