// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'switch_organization_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SwitchOrganizationDto extends SwitchOrganizationDto {
  @override
  final String organizationId;

  factory _$SwitchOrganizationDto(
          [void Function(SwitchOrganizationDtoBuilder)? updates]) =>
      (SwitchOrganizationDtoBuilder()..update(updates))._build();

  _$SwitchOrganizationDto._({required this.organizationId}) : super._();
  @override
  SwitchOrganizationDto rebuild(
          void Function(SwitchOrganizationDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SwitchOrganizationDtoBuilder toBuilder() =>
      SwitchOrganizationDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SwitchOrganizationDto &&
        organizationId == other.organizationId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, organizationId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SwitchOrganizationDto')
          ..add('organizationId', organizationId))
        .toString();
  }
}

class SwitchOrganizationDtoBuilder
    implements Builder<SwitchOrganizationDto, SwitchOrganizationDtoBuilder> {
  _$SwitchOrganizationDto? _$v;

  String? _organizationId;
  String? get organizationId => _$this._organizationId;
  set organizationId(String? organizationId) =>
      _$this._organizationId = organizationId;

  SwitchOrganizationDtoBuilder() {
    SwitchOrganizationDto._defaults(this);
  }

  SwitchOrganizationDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _organizationId = $v.organizationId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SwitchOrganizationDto other) {
    _$v = other as _$SwitchOrganizationDto;
  }

  @override
  void update(void Function(SwitchOrganizationDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SwitchOrganizationDto build() => _build();

  _$SwitchOrganizationDto _build() {
    final _$result = _$v ??
        _$SwitchOrganizationDto._(
          organizationId: BuiltValueNullFieldError.checkNotNull(
              organizationId, r'SwitchOrganizationDto', 'organizationId'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
