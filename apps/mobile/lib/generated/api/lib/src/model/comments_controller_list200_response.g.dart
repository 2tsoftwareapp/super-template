// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'comments_controller_list200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CommentsControllerList200Response
    extends CommentsControllerList200Response {
  @override
  final BuiltList<CommentDto> data;
  @override
  final PaginationMetaDto meta;

  factory _$CommentsControllerList200Response(
          [void Function(CommentsControllerList200ResponseBuilder)? updates]) =>
      (CommentsControllerList200ResponseBuilder()..update(updates))._build();

  _$CommentsControllerList200Response._(
      {required this.data, required this.meta})
      : super._();
  @override
  CommentsControllerList200Response rebuild(
          void Function(CommentsControllerList200ResponseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CommentsControllerList200ResponseBuilder toBuilder() =>
      CommentsControllerList200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CommentsControllerList200Response &&
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
    return (newBuiltValueToStringHelper(r'CommentsControllerList200Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class CommentsControllerList200ResponseBuilder
    implements
        Builder<CommentsControllerList200Response,
            CommentsControllerList200ResponseBuilder> {
  _$CommentsControllerList200Response? _$v;

  ListBuilder<CommentDto>? _data;
  ListBuilder<CommentDto> get data =>
      _$this._data ??= ListBuilder<CommentDto>();
  set data(ListBuilder<CommentDto>? data) => _$this._data = data;

  PaginationMetaDtoBuilder? _meta;
  PaginationMetaDtoBuilder get meta =>
      _$this._meta ??= PaginationMetaDtoBuilder();
  set meta(PaginationMetaDtoBuilder? meta) => _$this._meta = meta;

  CommentsControllerList200ResponseBuilder() {
    CommentsControllerList200Response._defaults(this);
  }

  CommentsControllerList200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CommentsControllerList200Response other) {
    _$v = other as _$CommentsControllerList200Response;
  }

  @override
  void update(
      void Function(CommentsControllerList200ResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CommentsControllerList200Response build() => _build();

  _$CommentsControllerList200Response _build() {
    _$CommentsControllerList200Response _$result;
    try {
      _$result = _$v ??
          _$CommentsControllerList200Response._(
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
            r'CommentsControllerList200Response', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
