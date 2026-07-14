// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'update_admin_user_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdateAdminUserDto extends UpdateAdminUserDto {
  @override
  final String? email;
  @override
  final String? displayName;
  @override
  final JsonObject? avatarUrl;

  factory _$UpdateAdminUserDto([
    void Function(UpdateAdminUserDtoBuilder)? updates,
  ]) =>
      (UpdateAdminUserDtoBuilder()..update(updates))._build();

  _$UpdateAdminUserDto._({this.email, this.displayName, this.avatarUrl})
      : super._();
  @override
  UpdateAdminUserDto rebuild(
    void Function(UpdateAdminUserDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateAdminUserDtoBuilder toBuilder() =>
      UpdateAdminUserDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateAdminUserDto &&
        email == other.email &&
        displayName == other.displayName &&
        avatarUrl == other.avatarUrl;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, email.hashCode);
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, avatarUrl.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdateAdminUserDto')
          ..add('email', email)
          ..add('displayName', displayName)
          ..add('avatarUrl', avatarUrl))
        .toString();
  }
}

class UpdateAdminUserDtoBuilder
    implements Builder<UpdateAdminUserDto, UpdateAdminUserDtoBuilder> {
  _$UpdateAdminUserDto? _$v;

  String? _email;
  String? get email => _$this._email;
  set email(String? email) => _$this._email = email;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  JsonObject? _avatarUrl;
  JsonObject? get avatarUrl => _$this._avatarUrl;
  set avatarUrl(JsonObject? avatarUrl) => _$this._avatarUrl = avatarUrl;

  UpdateAdminUserDtoBuilder() {
    UpdateAdminUserDto._defaults(this);
  }

  UpdateAdminUserDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _email = $v.email;
      _displayName = $v.displayName;
      _avatarUrl = $v.avatarUrl;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateAdminUserDto other) {
    _$v = other as _$UpdateAdminUserDto;
  }

  @override
  void update(void Function(UpdateAdminUserDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateAdminUserDto build() => _build();

  _$UpdateAdminUserDto _build() {
    final _$result = _$v ??
        _$UpdateAdminUserDto._(
          email: email,
          displayName: displayName,
          avatarUrl: avatarUrl,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
