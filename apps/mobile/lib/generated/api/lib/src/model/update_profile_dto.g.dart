// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'update_profile_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdateProfileDto extends UpdateProfileDto {
  @override
  final String? displayName;
  @override
  final JsonObject? avatarUrl;
  @override
  final JsonObject? avatarFileId;

  factory _$UpdateProfileDto([
    void Function(UpdateProfileDtoBuilder)? updates,
  ]) =>
      (UpdateProfileDtoBuilder()..update(updates))._build();

  _$UpdateProfileDto._({this.displayName, this.avatarUrl, this.avatarFileId})
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
        displayName == other.displayName &&
        avatarUrl == other.avatarUrl &&
        avatarFileId == other.avatarFileId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, avatarUrl.hashCode);
    _$hash = $jc(_$hash, avatarFileId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdateProfileDto')
          ..add('displayName', displayName)
          ..add('avatarUrl', avatarUrl)
          ..add('avatarFileId', avatarFileId))
        .toString();
  }
}

class UpdateProfileDtoBuilder
    implements Builder<UpdateProfileDto, UpdateProfileDtoBuilder> {
  _$UpdateProfileDto? _$v;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  JsonObject? _avatarUrl;
  JsonObject? get avatarUrl => _$this._avatarUrl;
  set avatarUrl(JsonObject? avatarUrl) => _$this._avatarUrl = avatarUrl;

  JsonObject? _avatarFileId;
  JsonObject? get avatarFileId => _$this._avatarFileId;
  set avatarFileId(JsonObject? avatarFileId) =>
      _$this._avatarFileId = avatarFileId;

  UpdateProfileDtoBuilder() {
    UpdateProfileDto._defaults(this);
  }

  UpdateProfileDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _displayName = $v.displayName;
      _avatarUrl = $v.avatarUrl;
      _avatarFileId = $v.avatarFileId;
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
          displayName: displayName,
          avatarUrl: avatarUrl,
          avatarFileId: avatarFileId,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
