// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'verify_mfa_challenge_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$VerifyMfaChallengeDto extends VerifyMfaChallengeDto {
  @override
  final String code;
  @override
  final String mfaToken;

  factory _$VerifyMfaChallengeDto([
    void Function(VerifyMfaChallengeDtoBuilder)? updates,
  ]) =>
      (VerifyMfaChallengeDtoBuilder()..update(updates))._build();

  _$VerifyMfaChallengeDto._({required this.code, required this.mfaToken})
      : super._();
  @override
  VerifyMfaChallengeDto rebuild(
    void Function(VerifyMfaChallengeDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  VerifyMfaChallengeDtoBuilder toBuilder() =>
      VerifyMfaChallengeDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is VerifyMfaChallengeDto &&
        code == other.code &&
        mfaToken == other.mfaToken;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, code.hashCode);
    _$hash = $jc(_$hash, mfaToken.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'VerifyMfaChallengeDto')
          ..add('code', code)
          ..add('mfaToken', mfaToken))
        .toString();
  }
}

class VerifyMfaChallengeDtoBuilder
    implements Builder<VerifyMfaChallengeDto, VerifyMfaChallengeDtoBuilder> {
  _$VerifyMfaChallengeDto? _$v;

  String? _code;
  String? get code => _$this._code;
  set code(String? code) => _$this._code = code;

  String? _mfaToken;
  String? get mfaToken => _$this._mfaToken;
  set mfaToken(String? mfaToken) => _$this._mfaToken = mfaToken;

  VerifyMfaChallengeDtoBuilder() {
    VerifyMfaChallengeDto._defaults(this);
  }

  VerifyMfaChallengeDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _code = $v.code;
      _mfaToken = $v.mfaToken;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(VerifyMfaChallengeDto other) {
    _$v = other as _$VerifyMfaChallengeDto;
  }

  @override
  void update(void Function(VerifyMfaChallengeDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  VerifyMfaChallengeDto build() => _build();

  _$VerifyMfaChallengeDto _build() {
    final _$result = _$v ??
        _$VerifyMfaChallengeDto._(
          code: BuiltValueNullFieldError.checkNotNull(
            code,
            r'VerifyMfaChallengeDto',
            'code',
          ),
          mfaToken: BuiltValueNullFieldError.checkNotNull(
            mfaToken,
            r'VerifyMfaChallengeDto',
            'mfaToken',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
