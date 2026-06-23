// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'mfa_setup_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MfaSetupResponseDto extends MfaSetupResponseDto {
  @override
  final String secret;
  @override
  final String otpauthUrl;

  factory _$MfaSetupResponseDto([
    void Function(MfaSetupResponseDtoBuilder)? updates,
  ]) =>
      (MfaSetupResponseDtoBuilder()..update(updates))._build();

  _$MfaSetupResponseDto._({required this.secret, required this.otpauthUrl})
      : super._();
  @override
  MfaSetupResponseDto rebuild(
    void Function(MfaSetupResponseDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  MfaSetupResponseDtoBuilder toBuilder() =>
      MfaSetupResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MfaSetupResponseDto &&
        secret == other.secret &&
        otpauthUrl == other.otpauthUrl;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, secret.hashCode);
    _$hash = $jc(_$hash, otpauthUrl.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MfaSetupResponseDto')
          ..add('secret', secret)
          ..add('otpauthUrl', otpauthUrl))
        .toString();
  }
}

class MfaSetupResponseDtoBuilder
    implements Builder<MfaSetupResponseDto, MfaSetupResponseDtoBuilder> {
  _$MfaSetupResponseDto? _$v;

  String? _secret;
  String? get secret => _$this._secret;
  set secret(String? secret) => _$this._secret = secret;

  String? _otpauthUrl;
  String? get otpauthUrl => _$this._otpauthUrl;
  set otpauthUrl(String? otpauthUrl) => _$this._otpauthUrl = otpauthUrl;

  MfaSetupResponseDtoBuilder() {
    MfaSetupResponseDto._defaults(this);
  }

  MfaSetupResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _secret = $v.secret;
      _otpauthUrl = $v.otpauthUrl;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MfaSetupResponseDto other) {
    _$v = other as _$MfaSetupResponseDto;
  }

  @override
  void update(void Function(MfaSetupResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MfaSetupResponseDto build() => _build();

  _$MfaSetupResponseDto _build() {
    final _$result = _$v ??
        _$MfaSetupResponseDto._(
          secret: BuiltValueNullFieldError.checkNotNull(
            secret,
            r'MfaSetupResponseDto',
            'secret',
          ),
          otpauthUrl: BuiltValueNullFieldError.checkNotNull(
            otpauthUrl,
            r'MfaSetupResponseDto',
            'otpauthUrl',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
