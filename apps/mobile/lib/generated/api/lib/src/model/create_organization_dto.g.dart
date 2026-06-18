// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'create_organization_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateOrganizationDto extends CreateOrganizationDto {
  @override
  final String name;

  factory _$CreateOrganizationDto([
    void Function(CreateOrganizationDtoBuilder)? updates,
  ]) =>
      (CreateOrganizationDtoBuilder()..update(updates))._build();

  _$CreateOrganizationDto._({required this.name}) : super._();
  @override
  CreateOrganizationDto rebuild(
    void Function(CreateOrganizationDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateOrganizationDtoBuilder toBuilder() =>
      CreateOrganizationDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateOrganizationDto && name == other.name;
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
      r'CreateOrganizationDto',
    )..add('name', name))
        .toString();
  }
}

class CreateOrganizationDtoBuilder
    implements Builder<CreateOrganizationDto, CreateOrganizationDtoBuilder> {
  _$CreateOrganizationDto? _$v;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  CreateOrganizationDtoBuilder() {
    CreateOrganizationDto._defaults(this);
  }

  CreateOrganizationDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _name = $v.name;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateOrganizationDto other) {
    _$v = other as _$CreateOrganizationDto;
  }

  @override
  void update(void Function(CreateOrganizationDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateOrganizationDto build() => _build();

  _$CreateOrganizationDto _build() {
    final _$result = _$v ??
        _$CreateOrganizationDto._(
          name: BuiltValueNullFieldError.checkNotNull(
            name,
            r'CreateOrganizationDto',
            'name',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
