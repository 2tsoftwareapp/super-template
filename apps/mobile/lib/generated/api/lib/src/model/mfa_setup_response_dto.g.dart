// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'mfa_setup_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MfaSetupResponseDto extends MfaSetupResponseDto {
  @override
  final String otpauthUrl;
  @override
  final String secret;

  factory _$MfaSetupResponseDto([
    void Function(MfaSetupResponseDtoBuilder)? updates,
  ]) =>
      (MfaSetupResponseDtoBuilder()..update(updates))._build();

  _$MfaSetupResponseDto._({required this.otpauthUrl, required this.secret})
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
        otpauthUrl == other.otpauthUrl &&
        secret == other.secret;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, otpauthUrl.hashCode);
    _$hash = $jc(_$hash, secret.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MfaSetupResponseDto')
          ..add('otpauthUrl', otpauthUrl)
          ..add('secret', secret))
        .toString();
  }
}

class MfaSetupResponseDtoBuilder
    implements Builder<MfaSetupResponseDto, MfaSetupResponseDtoBuilder> {
  _$MfaSetupResponseDto? _$v;

  String? _otpauthUrl;
  String? get otpauthUrl => _$this._otpauthUrl;
  set otpauthUrl(String? otpauthUrl) => _$this._otpauthUrl = otpauthUrl;

  String? _secret;
  String? get secret => _$this._secret;
  set secret(String? secret) => _$this._secret = secret;

  MfaSetupResponseDtoBuilder() {
    MfaSetupResponseDto._defaults(this);
  }

  MfaSetupResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _otpauthUrl = $v.otpauthUrl;
      _secret = $v.secret;
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
          otpauthUrl: BuiltValueNullFieldError.checkNotNull(
            otpauthUrl,
            r'MfaSetupResponseDto',
            'otpauthUrl',
          ),
          secret: BuiltValueNullFieldError.checkNotNull(
            secret,
            r'MfaSetupResponseDto',
            'secret',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
