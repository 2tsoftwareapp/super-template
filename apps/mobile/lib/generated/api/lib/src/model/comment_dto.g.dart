// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'comment_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CommentDto extends CommentDto {
  @override
  final String id;
  @override
  final String entityType;
  @override
  final String entityId;
  @override
  final JsonObject? parentId;
  @override
  final String authorId;
  @override
  final String content;
  @override
  final String createdAt;
  @override
  final String updatedAt;

  factory _$CommentDto([void Function(CommentDtoBuilder)? updates]) =>
      (CommentDtoBuilder()..update(updates))._build();

  _$CommentDto._(
      {required this.id,
      required this.entityType,
      required this.entityId,
      this.parentId,
      required this.authorId,
      required this.content,
      required this.createdAt,
      required this.updatedAt})
      : super._();
  @override
  CommentDto rebuild(void Function(CommentDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CommentDtoBuilder toBuilder() => CommentDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CommentDto &&
        id == other.id &&
        entityType == other.entityType &&
        entityId == other.entityId &&
        parentId == other.parentId &&
        authorId == other.authorId &&
        content == other.content &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, entityType.hashCode);
    _$hash = $jc(_$hash, entityId.hashCode);
    _$hash = $jc(_$hash, parentId.hashCode);
    _$hash = $jc(_$hash, authorId.hashCode);
    _$hash = $jc(_$hash, content.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CommentDto')
          ..add('id', id)
          ..add('entityType', entityType)
          ..add('entityId', entityId)
          ..add('parentId', parentId)
          ..add('authorId', authorId)
          ..add('content', content)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class CommentDtoBuilder implements Builder<CommentDto, CommentDtoBuilder> {
  _$CommentDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _entityType;
  String? get entityType => _$this._entityType;
  set entityType(String? entityType) => _$this._entityType = entityType;

  String? _entityId;
  String? get entityId => _$this._entityId;
  set entityId(String? entityId) => _$this._entityId = entityId;

  JsonObject? _parentId;
  JsonObject? get parentId => _$this._parentId;
  set parentId(JsonObject? parentId) => _$this._parentId = parentId;

  String? _authorId;
  String? get authorId => _$this._authorId;
  set authorId(String? authorId) => _$this._authorId = authorId;

  String? _content;
  String? get content => _$this._content;
  set content(String? content) => _$this._content = content;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  CommentDtoBuilder() {
    CommentDto._defaults(this);
  }

  CommentDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _entityType = $v.entityType;
      _entityId = $v.entityId;
      _parentId = $v.parentId;
      _authorId = $v.authorId;
      _content = $v.content;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CommentDto other) {
    _$v = other as _$CommentDto;
  }

  @override
  void update(void Function(CommentDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CommentDto build() => _build();

  _$CommentDto _build() {
    final _$result = _$v ??
        _$CommentDto._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'CommentDto', 'id'),
          entityType: BuiltValueNullFieldError.checkNotNull(
              entityType, r'CommentDto', 'entityType'),
          entityId: BuiltValueNullFieldError.checkNotNull(
              entityId, r'CommentDto', 'entityId'),
          parentId: parentId,
          authorId: BuiltValueNullFieldError.checkNotNull(
              authorId, r'CommentDto', 'authorId'),
          content: BuiltValueNullFieldError.checkNotNull(
              content, r'CommentDto', 'content'),
          createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt, r'CommentDto', 'createdAt'),
          updatedAt: BuiltValueNullFieldError.checkNotNull(
              updatedAt, r'CommentDto', 'updatedAt'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
