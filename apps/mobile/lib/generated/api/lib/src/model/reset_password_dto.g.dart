// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'reset_password_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ResetPasswordDto extends ResetPasswordDto {
  @override
  final String newPassword;
  @override
  final String token;

  factory _$ResetPasswordDto([
    void Function(ResetPasswordDtoBuilder)? updates,
  ]) =>
      (ResetPasswordDtoBuilder()..update(updates))._build();

  _$ResetPasswordDto._({required this.newPassword, required this.token})
      : super._();
  @override
  ResetPasswordDto rebuild(void Function(ResetPasswordDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ResetPasswordDtoBuilder toBuilder() =>
      ResetPasswordDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ResetPasswordDto &&
        newPassword == other.newPassword &&
        token == other.token;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, newPassword.hashCode);
    _$hash = $jc(_$hash, token.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ResetPasswordDto')
          ..add('newPassword', newPassword)
          ..add('token', token))
        .toString();
  }
}

class ResetPasswordDtoBuilder
    implements Builder<ResetPasswordDto, ResetPasswordDtoBuilder> {
  _$ResetPasswordDto? _$v;

  String? _newPassword;
  String? get newPassword => _$this._newPassword;
  set newPassword(String? newPassword) => _$this._newPassword = newPassword;

  String? _token;
  String? get token => _$this._token;
  set token(String? token) => _$this._token = token;

  ResetPasswordDtoBuilder() {
    ResetPasswordDto._defaults(this);
  }

  ResetPasswordDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _newPassword = $v.newPassword;
      _token = $v.token;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ResetPasswordDto other) {
    _$v = other as _$ResetPasswordDto;
  }

  @override
  void update(void Function(ResetPasswordDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ResetPasswordDto build() => _build();

  _$ResetPasswordDto _build() {
    final _$result = _$v ??
        _$ResetPasswordDto._(
          newPassword: BuiltValueNullFieldError.checkNotNull(
            newPassword,
            r'ResetPasswordDto',
            'newPassword',
          ),
          token: BuiltValueNullFieldError.checkNotNull(
            token,
            r'ResetPasswordDto',
            'token',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
