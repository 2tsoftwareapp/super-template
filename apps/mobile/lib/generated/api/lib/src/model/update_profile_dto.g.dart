// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'update_profile_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdateProfileDto extends UpdateProfileDto {
  @override
  final JsonObject? avatarFileId;
  @override
  final JsonObject? avatarUrl;
  @override
  final String? displayName;

  factory _$UpdateProfileDto([
    void Function(UpdateProfileDtoBuilder)? updates,
  ]) =>
      (UpdateProfileDtoBuilder()..update(updates))._build();

  _$UpdateProfileDto._({this.avatarFileId, this.avatarUrl, this.displayName})
      : super._();
  @override
  UpdateProfileDto rebuild(void Function(UpdateProfileDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateProfileDtoBuilder toBuilder() =>
      UpdateProfileDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateProfileDto &&
        avatarFileId == other.avatarFileId &&
        avatarUrl == other.avatarUrl &&
        displayName == other.displayName;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, avatarFileId.hashCode);
    _$hash = $jc(_$hash, avatarUrl.hashCode);
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdateProfileDto')
          ..add('avatarFileId', avatarFileId)
          ..add('avatarUrl', avatarUrl)
          ..add('displayName', displayName))
        .toString();
  }
}

class UpdateProfileDtoBuilder
    implements Builder<UpdateProfileDto, UpdateProfileDtoBuilder> {
  _$UpdateProfileDto? _$v;

  JsonObject? _avatarFileId;
  JsonObject? get avatarFileId => _$this._avatarFileId;
  set avatarFileId(JsonObject? avatarFileId) =>
      _$this._avatarFileId = avatarFileId;

  JsonObject? _avatarUrl;
  JsonObject? get avatarUrl => _$this._avatarUrl;
  set avatarUrl(JsonObject? avatarUrl) => _$this._avatarUrl = avatarUrl;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  UpdateProfileDtoBuilder() {
    UpdateProfileDto._defaults(this);
  }

  UpdateProfileDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _avatarFileId = $v.avatarFileId;
      _avatarUrl = $v.avatarUrl;
      _displayName = $v.displayName;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateProfileDto other) {
    _$v = other as _$UpdateProfileDto;
  }

  @override
  void update(void Function(UpdateProfileDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateProfileDto build() => _build();

  _$UpdateProfileDto _build() {
    final _$result = _$v ??
        _$UpdateProfileDto._(
          avatarFileId: avatarFileId,
          avatarUrl: avatarUrl,
          displayName: displayName,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
