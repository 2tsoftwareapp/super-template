// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'success_message_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SuccessMessageDto extends SuccessMessageDto {
  @override
  final String message;
  @override
  final bool success;

  factory _$SuccessMessageDto([
    void Function(SuccessMessageDtoBuilder)? updates,
  ]) =>
      (SuccessMessageDtoBuilder()..update(updates))._build();

  _$SuccessMessageDto._({required this.message, required this.success})
      : super._();
  @override
  SuccessMessageDto rebuild(void Function(SuccessMessageDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SuccessMessageDtoBuilder toBuilder() =>
      SuccessMessageDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SuccessMessageDto &&
        message == other.message &&
        success == other.success;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, message.hashCode);
    _$hash = $jc(_$hash, success.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SuccessMessageDto')
          ..add('message', message)
          ..add('success', success))
        .toString();
  }
}

class SuccessMessageDtoBuilder
    implements Builder<SuccessMessageDto, SuccessMessageDtoBuilder> {
  _$SuccessMessageDto? _$v;

  String? _message;
  String? get message => _$this._message;
  set message(String? message) => _$this._message = message;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  SuccessMessageDtoBuilder() {
    SuccessMessageDto._defaults(this);
  }

  SuccessMessageDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _message = $v.message;
      _success = $v.success;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SuccessMessageDto other) {
    _$v = other as _$SuccessMessageDto;
  }

  @override
  void update(void Function(SuccessMessageDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SuccessMessageDto build() => _build();

  _$SuccessMessageDto _build() {
    final _$result = _$v ??
        _$SuccessMessageDto._(
          message: BuiltValueNullFieldError.checkNotNull(
            message,
            r'SuccessMessageDto',
            'message',
          ),
          success: BuiltValueNullFieldError.checkNotNull(
            success,
            r'SuccessMessageDto',
            'success',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
