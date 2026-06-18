// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'application_setting_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ApplicationSettingDto extends ApplicationSettingDto {
  @override
  final String key;
  @override
  final BuiltMap<String, JsonObject?> value;
  @override
  final JsonObject? updatedById;
  @override
  final String createdAt;
  @override
  final String updatedAt;

  factory _$ApplicationSettingDto([
    void Function(ApplicationSettingDtoBuilder)? updates,
  ]) =>
      (ApplicationSettingDtoBuilder()..update(updates))._build();

  _$ApplicationSettingDto._({
    required this.key,
    required this.value,
    this.updatedById,
    required this.createdAt,
    required this.updatedAt,
  }) : super._();
  @override
  ApplicationSettingDto rebuild(
    void Function(ApplicationSettingDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  ApplicationSettingDtoBuilder toBuilder() =>
      ApplicationSettingDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ApplicationSettingDto &&
        key == other.key &&
        value == other.value &&
        updatedById == other.updatedById &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, key.hashCode);
    _$hash = $jc(_$hash, value.hashCode);
    _$hash = $jc(_$hash, updatedById.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ApplicationSettingDto')
          ..add('key', key)
          ..add('value', value)
          ..add('updatedById', updatedById)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class ApplicationSettingDtoBuilder
    implements Builder<ApplicationSettingDto, ApplicationSettingDtoBuilder> {
  _$ApplicationSettingDto? _$v;

  String? _key;
  String? get key => _$this._key;
  set key(String? key) => _$this._key = key;

  MapBuilder<String, JsonObject?>? _value;
  MapBuilder<String, JsonObject?> get value =>
      _$this._value ??= MapBuilder<String, JsonObject?>();
  set value(MapBuilder<String, JsonObject?>? value) => _$this._value = value;

  JsonObject? _updatedById;
  JsonObject? get updatedById => _$this._updatedById;
  set updatedById(JsonObject? updatedById) => _$this._updatedById = updatedById;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  ApplicationSettingDtoBuilder() {
    ApplicationSettingDto._defaults(this);
  }

  ApplicationSettingDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _key = $v.key;
      _value = $v.value.toBuilder();
      _updatedById = $v.updatedById;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ApplicationSettingDto other) {
    _$v = other as _$ApplicationSettingDto;
  }

  @override
  void update(void Function(ApplicationSettingDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ApplicationSettingDto build() => _build();

  _$ApplicationSettingDto _build() {
    _$ApplicationSettingDto _$result;
    try {
      _$result = _$v ??
          _$ApplicationSettingDto._(
            key: BuiltValueNullFieldError.checkNotNull(
              key,
              r'ApplicationSettingDto',
              'key',
            ),
            value: value.build(),
            updatedById: updatedById,
            createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt,
              r'ApplicationSettingDto',
              'createdAt',
            ),
            updatedAt: BuiltValueNullFieldError.checkNotNull(
              updatedAt,
              r'ApplicationSettingDto',
              'updatedAt',
            ),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'value';
        value.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'ApplicationSettingDto',
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
