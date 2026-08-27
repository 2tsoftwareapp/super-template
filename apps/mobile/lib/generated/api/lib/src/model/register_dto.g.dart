// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'register_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RegisterDto extends RegisterDto {
  @override
  final String displayName;
  @override
  final String email;
  @override
  final String password;

  factory _$RegisterDto([void Function(RegisterDtoBuilder)? updates]) =>
      (RegisterDtoBuilder()..update(updates))._build();

  _$RegisterDto._({
    required this.displayName,
    required this.email,
    required this.password,
  }) : super._();
  @override
  RegisterDto rebuild(void Function(RegisterDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  RegisterDtoBuilder toBuilder() => RegisterDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RegisterDto &&
        displayName == other.displayName &&
        email == other.email &&
        password == other.password;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, email.hashCode);
    _$hash = $jc(_$hash, password.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RegisterDto')
          ..add('displayName', displayName)
          ..add('email', email)
          ..add('password', password))
        .toString();
  }
}

class RegisterDtoBuilder implements Builder<RegisterDto, RegisterDtoBuilder> {
  _$RegisterDto? _$v;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  String? _email;
  String? get email => _$this._email;
  set email(String? email) => _$this._email = email;

  String? _password;
  String? get password => _$this._password;
  set password(String? password) => _$this._password = password;

  RegisterDtoBuilder() {
    RegisterDto._defaults(this);
  }

  RegisterDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _displayName = $v.displayName;
      _email = $v.email;
      _password = $v.password;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RegisterDto other) {
    _$v = other as _$RegisterDto;
  }

  @override
  void update(void Function(RegisterDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RegisterDto build() => _build();

  _$RegisterDto _build() {
    final _$result = _$v ??
        _$RegisterDto._(
          displayName: BuiltValueNullFieldError.checkNotNull(
            displayName,
            r'RegisterDto',
            'displayName',
          ),
          email: BuiltValueNullFieldError.checkNotNull(
            email,
            r'RegisterDto',
            'email',
          ),
          password: BuiltValueNullFieldError.checkNotNull(
            password,
            r'RegisterDto',
            'password',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
