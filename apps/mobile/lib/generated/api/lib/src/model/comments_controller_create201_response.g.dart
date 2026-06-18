// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'comments_controller_create201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CommentsControllerCreate201Response
    extends CommentsControllerCreate201Response {
  @override
  final CommentDto data;
  @override
  final RequestMetaDto meta;

  factory _$CommentsControllerCreate201Response([
    void Function(CommentsControllerCreate201ResponseBuilder)? updates,
  ]) =>
      (CommentsControllerCreate201ResponseBuilder()..update(updates))._build();

  _$CommentsControllerCreate201Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  CommentsControllerCreate201Response rebuild(
    void Function(CommentsControllerCreate201ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  CommentsControllerCreate201ResponseBuilder toBuilder() =>
      CommentsControllerCreate201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CommentsControllerCreate201Response &&
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
    return (newBuiltValueToStringHelper(r'CommentsControllerCreate201Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class CommentsControllerCreate201ResponseBuilder
    implements
        Builder<CommentsControllerCreate201Response,
            CommentsControllerCreate201ResponseBuilder> {
  _$CommentsControllerCreate201Response? _$v;

  CommentDtoBuilder? _data;
  CommentDtoBuilder get data => _$this._data ??= CommentDtoBuilder();
  set data(CommentDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  CommentsControllerCreate201ResponseBuilder() {
    CommentsControllerCreate201Response._defaults(this);
  }

  CommentsControllerCreate201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CommentsControllerCreate201Response other) {
    _$v = other as _$CommentsControllerCreate201Response;
  }

  @override
  void update(
    void Function(CommentsControllerCreate201ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  CommentsControllerCreate201Response build() => _build();

  _$CommentsControllerCreate201Response _build() {
    _$CommentsControllerCreate201Response _$result;
    try {
      _$result = _$v ??
          _$CommentsControllerCreate201Response._(
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
          r'CommentsControllerCreate201Response',
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
