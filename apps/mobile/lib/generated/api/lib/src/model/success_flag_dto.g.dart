// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'success_flag_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SuccessFlagDto extends SuccessFlagDto {
  @override
  final bool success;

  factory _$SuccessFlagDto([void Function(SuccessFlagDtoBuilder)? updates]) =>
      (SuccessFlagDtoBuilder()..update(updates))._build();

  _$SuccessFlagDto._({required this.success}) : super._();
  @override
  SuccessFlagDto rebuild(void Function(SuccessFlagDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SuccessFlagDtoBuilder toBuilder() => SuccessFlagDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SuccessFlagDto && success == other.success;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, success.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SuccessFlagDto')
          ..add('success', success))
        .toString();
  }
}

class SuccessFlagDtoBuilder
    implements Builder<SuccessFlagDto, SuccessFlagDtoBuilder> {
  _$SuccessFlagDto? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  SuccessFlagDtoBuilder() {
    SuccessFlagDto._defaults(this);
  }

  SuccessFlagDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SuccessFlagDto other) {
    _$v = other as _$SuccessFlagDto;
  }

  @override
  void update(void Function(SuccessFlagDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SuccessFlagDto build() => _build();

  _$SuccessFlagDto _build() {
    final _$result = _$v ??
        _$SuccessFlagDto._(
          success: BuiltValueNullFieldError.checkNotNull(
              success, r'SuccessFlagDto', 'success'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
