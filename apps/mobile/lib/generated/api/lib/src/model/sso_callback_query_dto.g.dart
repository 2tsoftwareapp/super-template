// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'sso_callback_query_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SsoCallbackQueryDto extends SsoCallbackQueryDto {
  @override
  final String code;
  @override
  final String state;

  factory _$SsoCallbackQueryDto([
    void Function(SsoCallbackQueryDtoBuilder)? updates,
  ]) =>
      (SsoCallbackQueryDtoBuilder()..update(updates))._build();

  _$SsoCallbackQueryDto._({required this.code, required this.state})
      : super._();
  @override
  SsoCallbackQueryDto rebuild(
    void Function(SsoCallbackQueryDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  SsoCallbackQueryDtoBuilder toBuilder() =>
      SsoCallbackQueryDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SsoCallbackQueryDto &&
        code == other.code &&
        state == other.state;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, code.hashCode);
    _$hash = $jc(_$hash, state.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SsoCallbackQueryDto')
          ..add('code', code)
          ..add('state', state))
        .toString();
  }
}

class SsoCallbackQueryDtoBuilder
    implements Builder<SsoCallbackQueryDto, SsoCallbackQueryDtoBuilder> {
  _$SsoCallbackQueryDto? _$v;

  String? _code;
  String? get code => _$this._code;
  set code(String? code) => _$this._code = code;

  String? _state;
  String? get state => _$this._state;
  set state(String? state) => _$this._state = state;

  SsoCallbackQueryDtoBuilder() {
    SsoCallbackQueryDto._defaults(this);
  }

  SsoCallbackQueryDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _code = $v.code;
      _state = $v.state;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SsoCallbackQueryDto other) {
    _$v = other as _$SsoCallbackQueryDto;
  }

  @override
  void update(void Function(SsoCallbackQueryDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SsoCallbackQueryDto build() => _build();

  _$SsoCallbackQueryDto _build() {
    final _$result = _$v ??
        _$SsoCallbackQueryDto._(
          code: BuiltValueNullFieldError.checkNotNull(
            code,
            r'SsoCallbackQueryDto',
            'code',
          ),
          state: BuiltValueNullFieldError.checkNotNull(
            state,
            r'SsoCallbackQueryDto',
            'state',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
