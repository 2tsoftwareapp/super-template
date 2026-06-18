// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'create_comment_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateCommentDto extends CreateCommentDto {
  @override
  final String entityType;
  @override
  final String entityId;
  @override
  final String? parentId;
  @override
  final String content;

  factory _$CreateCommentDto([
    void Function(CreateCommentDtoBuilder)? updates,
  ]) =>
      (CreateCommentDtoBuilder()..update(updates))._build();

  _$CreateCommentDto._({
    required this.entityType,
    required this.entityId,
    this.parentId,
    required this.content,
  }) : super._();
  @override
  CreateCommentDto rebuild(void Function(CreateCommentDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateCommentDtoBuilder toBuilder() =>
      CreateCommentDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateCommentDto &&
        entityType == other.entityType &&
        entityId == other.entityId &&
        parentId == other.parentId &&
        content == other.content;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, entityType.hashCode);
    _$hash = $jc(_$hash, entityId.hashCode);
    _$hash = $jc(_$hash, parentId.hashCode);
    _$hash = $jc(_$hash, content.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateCommentDto')
          ..add('entityType', entityType)
          ..add('entityId', entityId)
          ..add('parentId', parentId)
          ..add('content', content))
        .toString();
  }
}

class CreateCommentDtoBuilder
    implements Builder<CreateCommentDto, CreateCommentDtoBuilder> {
  _$CreateCommentDto? _$v;

  String? _entityType;
  String? get entityType => _$this._entityType;
  set entityType(String? entityType) => _$this._entityType = entityType;

  String? _entityId;
  String? get entityId => _$this._entityId;
  set entityId(String? entityId) => _$this._entityId = entityId;

  String? _parentId;
  String? get parentId => _$this._parentId;
  set parentId(String? parentId) => _$this._parentId = parentId;

  String? _content;
  String? get content => _$this._content;
  set content(String? content) => _$this._content = content;

  CreateCommentDtoBuilder() {
    CreateCommentDto._defaults(this);
  }

  CreateCommentDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _entityType = $v.entityType;
      _entityId = $v.entityId;
      _parentId = $v.parentId;
      _content = $v.content;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateCommentDto other) {
    _$v = other as _$CreateCommentDto;
  }

  @override
  void update(void Function(CreateCommentDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateCommentDto build() => _build();

  _$CreateCommentDto _build() {
    final _$result = _$v ??
        _$CreateCommentDto._(
          entityType: BuiltValueNullFieldError.checkNotNull(
            entityType,
            r'CreateCommentDto',
            'entityType',
          ),
          entityId: BuiltValueNullFieldError.checkNotNull(
            entityId,
            r'CreateCommentDto',
            'entityId',
          ),
          parentId: parentId,
          content: BuiltValueNullFieldError.checkNotNull(
            content,
            r'CreateCommentDto',
            'content',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
