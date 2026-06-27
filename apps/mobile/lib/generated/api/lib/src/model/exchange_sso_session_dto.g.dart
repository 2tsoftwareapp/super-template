// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'exchange_sso_session_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ExchangeSsoSessionDto extends ExchangeSsoSessionDto {
  @override
  final String code;

  factory _$ExchangeSsoSessionDto([
    void Function(ExchangeSsoSessionDtoBuilder)? updates,
  ]) =>
      (ExchangeSsoSessionDtoBuilder()..update(updates))._build();

  _$ExchangeSsoSessionDto._({required this.code}) : super._();
  @override
  ExchangeSsoSessionDto rebuild(
    void Function(ExchangeSsoSessionDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  ExchangeSsoSessionDtoBuilder toBuilder() =>
      ExchangeSsoSessionDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ExchangeSsoSessionDto && code == other.code;
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
      r'ExchangeSsoSessionDto',
    )..add('code', code))
        .toString();
  }
}

class ExchangeSsoSessionDtoBuilder
    implements Builder<ExchangeSsoSessionDto, ExchangeSsoSessionDtoBuilder> {
  _$ExchangeSsoSessionDto? _$v;

  String? _code;
  String? get code => _$this._code;
  set code(String? code) => _$this._code = code;

  ExchangeSsoSessionDtoBuilder() {
    ExchangeSsoSessionDto._defaults(this);
  }

  ExchangeSsoSessionDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _code = $v.code;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ExchangeSsoSessionDto other) {
    _$v = other as _$ExchangeSsoSessionDto;
  }

  @override
  void update(void Function(ExchangeSsoSessionDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ExchangeSsoSessionDto build() => _build();

  _$ExchangeSsoSessionDto _build() {
    final _$result = _$v ??
        _$ExchangeSsoSessionDto._(
          code: BuiltValueNullFieldError.checkNotNull(
            code,
            r'ExchangeSsoSessionDto',
            'code',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
