// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'start_sso_login_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$StartSsoLoginResponseDto extends StartSsoLoginResponseDto {
  @override
  final String authorizationUrl;

  factory _$StartSsoLoginResponseDto([
    void Function(StartSsoLoginResponseDtoBuilder)? updates,
  ]) =>
      (StartSsoLoginResponseDtoBuilder()..update(updates))._build();

  _$StartSsoLoginResponseDto._({required this.authorizationUrl}) : super._();
  @override
  StartSsoLoginResponseDto rebuild(
    void Function(StartSsoLoginResponseDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  StartSsoLoginResponseDtoBuilder toBuilder() =>
      StartSsoLoginResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is StartSsoLoginResponseDto &&
        authorizationUrl == other.authorizationUrl;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, authorizationUrl.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'StartSsoLoginResponseDto',
    )..add('authorizationUrl', authorizationUrl))
        .toString();
  }
}

class StartSsoLoginResponseDtoBuilder
    implements
        Builder<StartSsoLoginResponseDto, StartSsoLoginResponseDtoBuilder> {
  _$StartSsoLoginResponseDto? _$v;

  String? _authorizationUrl;
  String? get authorizationUrl => _$this._authorizationUrl;
  set authorizationUrl(String? authorizationUrl) =>
      _$this._authorizationUrl = authorizationUrl;

  StartSsoLoginResponseDtoBuilder() {
    StartSsoLoginResponseDto._defaults(this);
  }

  StartSsoLoginResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _authorizationUrl = $v.authorizationUrl;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(StartSsoLoginResponseDto other) {
    _$v = other as _$StartSsoLoginResponseDto;
  }

  @override
  void update(void Function(StartSsoLoginResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  StartSsoLoginResponseDto build() => _build();

  _$StartSsoLoginResponseDto _build() {
    final _$result = _$v ??
        _$StartSsoLoginResponseDto._(
          authorizationUrl: BuiltValueNullFieldError.checkNotNull(
            authorizationUrl,
            r'StartSsoLoginResponseDto',
            'authorizationUrl',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
