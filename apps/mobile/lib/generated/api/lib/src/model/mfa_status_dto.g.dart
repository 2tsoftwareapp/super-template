// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'mfa_status_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MfaStatusDto extends MfaStatusDto {
  @override
  final bool enabled;

  factory _$MfaStatusDto([void Function(MfaStatusDtoBuilder)? updates]) =>
      (MfaStatusDtoBuilder()..update(updates))._build();

  _$MfaStatusDto._({required this.enabled}) : super._();
  @override
  MfaStatusDto rebuild(void Function(MfaStatusDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MfaStatusDtoBuilder toBuilder() => MfaStatusDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MfaStatusDto && enabled == other.enabled;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, enabled.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'MfaStatusDto',
    )..add('enabled', enabled))
        .toString();
  }
}

class MfaStatusDtoBuilder
    implements Builder<MfaStatusDto, MfaStatusDtoBuilder> {
  _$MfaStatusDto? _$v;

  bool? _enabled;
  bool? get enabled => _$this._enabled;
  set enabled(bool? enabled) => _$this._enabled = enabled;

  MfaStatusDtoBuilder() {
    MfaStatusDto._defaults(this);
  }

  MfaStatusDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _enabled = $v.enabled;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MfaStatusDto other) {
    _$v = other as _$MfaStatusDto;
  }

  @override
  void update(void Function(MfaStatusDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MfaStatusDto build() => _build();

  _$MfaStatusDto _build() {
    final _$result = _$v ??
        _$MfaStatusDto._(
          enabled: BuiltValueNullFieldError.checkNotNull(
            enabled,
            r'MfaStatusDto',
            'enabled',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
