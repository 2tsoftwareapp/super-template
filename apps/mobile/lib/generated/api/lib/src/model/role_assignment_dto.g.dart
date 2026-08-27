// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'role_assignment_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RoleAssignmentDto extends RoleAssignmentDto {
  @override
  final String? organizationId;
  @override
  final String roleId;
  @override
  final String roleName;

  factory _$RoleAssignmentDto([
    void Function(RoleAssignmentDtoBuilder)? updates,
  ]) =>
      (RoleAssignmentDtoBuilder()..update(updates))._build();

  _$RoleAssignmentDto._({
    this.organizationId,
    required this.roleId,
    required this.roleName,
  }) : super._();
  @override
  RoleAssignmentDto rebuild(void Function(RoleAssignmentDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  RoleAssignmentDtoBuilder toBuilder() =>
      RoleAssignmentDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RoleAssignmentDto &&
        organizationId == other.organizationId &&
        roleId == other.roleId &&
        roleName == other.roleName;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, organizationId.hashCode);
    _$hash = $jc(_$hash, roleId.hashCode);
    _$hash = $jc(_$hash, roleName.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RoleAssignmentDto')
          ..add('organizationId', organizationId)
          ..add('roleId', roleId)
          ..add('roleName', roleName))
        .toString();
  }
}

class RoleAssignmentDtoBuilder
    implements Builder<RoleAssignmentDto, RoleAssignmentDtoBuilder> {
  _$RoleAssignmentDto? _$v;

  String? _organizationId;
  String? get organizationId => _$this._organizationId;
  set organizationId(String? organizationId) =>
      _$this._organizationId = organizationId;

  String? _roleId;
  String? get roleId => _$this._roleId;
  set roleId(String? roleId) => _$this._roleId = roleId;

  String? _roleName;
  String? get roleName => _$this._roleName;
  set roleName(String? roleName) => _$this._roleName = roleName;

  RoleAssignmentDtoBuilder() {
    RoleAssignmentDto._defaults(this);
  }

  RoleAssignmentDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _organizationId = $v.organizationId;
      _roleId = $v.roleId;
      _roleName = $v.roleName;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RoleAssignmentDto other) {
    _$v = other as _$RoleAssignmentDto;
  }

  @override
  void update(void Function(RoleAssignmentDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RoleAssignmentDto build() => _build();

  _$RoleAssignmentDto _build() {
    final _$result = _$v ??
        _$RoleAssignmentDto._(
          organizationId: organizationId,
          roleId: BuiltValueNullFieldError.checkNotNull(
            roleId,
            r'RoleAssignmentDto',
            'roleId',
          ),
          roleName: BuiltValueNullFieldError.checkNotNull(
            roleName,
            r'RoleAssignmentDto',
            'roleName',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
