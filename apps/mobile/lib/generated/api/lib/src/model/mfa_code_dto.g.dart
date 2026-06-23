// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'mfa_code_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MfaCodeDto extends MfaCodeDto {
  @override
  final String code;

  factory _$MfaCodeDto([void Function(MfaCodeDtoBuilder)? updates]) =>
      (MfaCodeDtoBuilder()..update(updates))._build();

  _$MfaCodeDto._({required this.code}) : super._();
  @override
  MfaCodeDto rebuild(void Function(MfaCodeDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MfaCodeDtoBuilder toBuilder() => MfaCodeDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MfaCodeDto && code == other.code;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, code.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'MfaCodeDto',
    )..add('code', code))
        .toString();
  }
}

class MfaCodeDtoBuilder implements Builder<MfaCodeDto, MfaCodeDtoBuilder> {
  _$MfaCodeDto? _$v;

  String? _code;
  String? get code => _$this._code;
  set code(String? code) => _$this._code = code;

  MfaCodeDtoBuilder() {
    MfaCodeDto._defaults(this);
  }

  MfaCodeDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _code = $v.code;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MfaCodeDto other) {
    _$v = other as _$MfaCodeDto;
  }

  @override
  void update(void Function(MfaCodeDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MfaCodeDto build() => _build();

  _$MfaCodeDto _build() {
    final _$result = _$v ??
        _$MfaCodeDto._(
          code: BuiltValueNullFieldError.checkNotNull(
            code,
            r'MfaCodeDto',
            'code',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
