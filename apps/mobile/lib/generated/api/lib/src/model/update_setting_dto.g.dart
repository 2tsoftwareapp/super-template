// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'update_setting_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdateSettingDto extends UpdateSettingDto {
  @override
  final BuiltMap<String, JsonObject?> value;

  factory _$UpdateSettingDto(
          [void Function(UpdateSettingDtoBuilder)? updates]) =>
      (UpdateSettingDtoBuilder()..update(updates))._build();

  _$UpdateSettingDto._({required this.value}) : super._();
  @override
  UpdateSettingDto rebuild(void Function(UpdateSettingDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateSettingDtoBuilder toBuilder() =>
      UpdateSettingDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateSettingDto && value == other.value;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, value.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdateSettingDto')
          ..add('value', value))
        .toString();
  }
}

class UpdateSettingDtoBuilder
    implements Builder<UpdateSettingDto, UpdateSettingDtoBuilder> {
  _$UpdateSettingDto? _$v;

  MapBuilder<String, JsonObject?>? _value;
  MapBuilder<String, JsonObject?> get value =>
      _$this._value ??= MapBuilder<String, JsonObject?>();
  set value(MapBuilder<String, JsonObject?>? value) => _$this._value = value;

  UpdateSettingDtoBuilder() {
    UpdateSettingDto._defaults(this);
  }

  UpdateSettingDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _value = $v.value.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateSettingDto other) {
    _$v = other as _$UpdateSettingDto;
  }

  @override
  void update(void Function(UpdateSettingDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateSettingDto build() => _build();

  _$UpdateSettingDto _build() {
    _$UpdateSettingDto _$result;
    try {
      _$result = _$v ??
          _$UpdateSettingDto._(
            value: value.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'value';
        value.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'UpdateSettingDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
