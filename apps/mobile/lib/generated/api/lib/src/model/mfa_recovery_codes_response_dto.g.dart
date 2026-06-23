// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'mfa_recovery_codes_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MfaRecoveryCodesResponseDto extends MfaRecoveryCodesResponseDto {
  @override
  final BuiltList<String> recoveryCodes;

  factory _$MfaRecoveryCodesResponseDto([
    void Function(MfaRecoveryCodesResponseDtoBuilder)? updates,
  ]) =>
      (MfaRecoveryCodesResponseDtoBuilder()..update(updates))._build();

  _$MfaRecoveryCodesResponseDto._({required this.recoveryCodes}) : super._();
  @override
  MfaRecoveryCodesResponseDto rebuild(
    void Function(MfaRecoveryCodesResponseDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  MfaRecoveryCodesResponseDtoBuilder toBuilder() =>
      MfaRecoveryCodesResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MfaRecoveryCodesResponseDto &&
        recoveryCodes == other.recoveryCodes;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, recoveryCodes.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'MfaRecoveryCodesResponseDto',
    )..add('recoveryCodes', recoveryCodes))
        .toString();
  }
}

class MfaRecoveryCodesResponseDtoBuilder
    implements
        Builder<MfaRecoveryCodesResponseDto,
            MfaRecoveryCodesResponseDtoBuilder> {
  _$MfaRecoveryCodesResponseDto? _$v;

  ListBuilder<String>? _recoveryCodes;
  ListBuilder<String> get recoveryCodes =>
      _$this._recoveryCodes ??= ListBuilder<String>();
  set recoveryCodes(ListBuilder<String>? recoveryCodes) =>
      _$this._recoveryCodes = recoveryCodes;

  MfaRecoveryCodesResponseDtoBuilder() {
    MfaRecoveryCodesResponseDto._defaults(this);
  }

  MfaRecoveryCodesResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _recoveryCodes = $v.recoveryCodes.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MfaRecoveryCodesResponseDto other) {
    _$v = other as _$MfaRecoveryCodesResponseDto;
  }

  @override
  void update(void Function(MfaRecoveryCodesResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MfaRecoveryCodesResponseDto build() => _build();

  _$MfaRecoveryCodesResponseDto _build() {
    _$MfaRecoveryCodesResponseDto _$result;
    try {
      _$result = _$v ??
          _$MfaRecoveryCodesResponseDto._(recoveryCodes: recoveryCodes.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'recoveryCodes';
        recoveryCodes.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'MfaRecoveryCodesResponseDto',
          _$failedField,
          e.toString(),
        );
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
