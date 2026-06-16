// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'update_comment_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdateCommentDto extends UpdateCommentDto {
  @override
  final String content;

  factory _$UpdateCommentDto(
          [void Function(UpdateCommentDtoBuilder)? updates]) =>
      (UpdateCommentDtoBuilder()..update(updates))._build();

  _$UpdateCommentDto._({required this.content}) : super._();
  @override
  UpdateCommentDto rebuild(void Function(UpdateCommentDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateCommentDtoBuilder toBuilder() =>
      UpdateCommentDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateCommentDto && content == other.content;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, content.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdateCommentDto')
          ..add('content', content))
        .toString();
  }
}

class UpdateCommentDtoBuilder
    implements Builder<UpdateCommentDto, UpdateCommentDtoBuilder> {
  _$UpdateCommentDto? _$v;

  String? _content;
  String? get content => _$this._content;
  set content(String? content) => _$this._content = content;

  UpdateCommentDtoBuilder() {
    UpdateCommentDto._defaults(this);
  }

  UpdateCommentDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _content = $v.content;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateCommentDto other) {
    _$v = other as _$UpdateCommentDto;
  }

  @override
  void update(void Function(UpdateCommentDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateCommentDto build() => _build();

  _$UpdateCommentDto _build() {
    final _$result = _$v ??
        _$UpdateCommentDto._(
          content: BuiltValueNullFieldError.checkNotNull(
              content, r'UpdateCommentDto', 'content'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
