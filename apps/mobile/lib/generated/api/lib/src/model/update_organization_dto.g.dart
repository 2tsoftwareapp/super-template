// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'update_organization_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdateOrganizationDto extends UpdateOrganizationDto {
  @override
  final String name;

  factory _$UpdateOrganizationDto([
    void Function(UpdateOrganizationDtoBuilder)? updates,
  ]) =>
      (UpdateOrganizationDtoBuilder()..update(updates))._build();

  _$UpdateOrganizationDto._({required this.name}) : super._();
  @override
  UpdateOrganizationDto rebuild(
    void Function(UpdateOrganizationDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateOrganizationDtoBuilder toBuilder() =>
      UpdateOrganizationDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateOrganizationDto && name == other.name;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'UpdateOrganizationDto',
    )..add('name', name))
        .toString();
  }
}

class UpdateOrganizationDtoBuilder
    implements Builder<UpdateOrganizationDto, UpdateOrganizationDtoBuilder> {
  _$UpdateOrganizationDto? _$v;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  UpdateOrganizationDtoBuilder() {
    UpdateOrganizationDto._defaults(this);
  }

  UpdateOrganizationDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _name = $v.name;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateOrganizationDto other) {
    _$v = other as _$UpdateOrganizationDto;
  }

  @override
  void update(void Function(UpdateOrganizationDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateOrganizationDto build() => _build();

  _$UpdateOrganizationDto _build() {
    final _$result = _$v ??
        _$UpdateOrganizationDto._(
          name: BuiltValueNullFieldError.checkNotNull(
            name,
            r'UpdateOrganizationDto',
            'name',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
