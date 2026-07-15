// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'role_assignment_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RoleAssignmentDto extends RoleAssignmentDto {
  @override
  final String roleName;
  @override
  final String roleId;
  @override
  final String? organizationId;

  factory _$RoleAssignmentDto([
    void Function(RoleAssignmentDtoBuilder)? updates,
  ]) =>
      (RoleAssignmentDtoBuilder()..update(updates))._build();

  _$RoleAssignmentDto._({
    required this.roleName,
    required this.roleId,
    this.organizationId,
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
        roleName == other.roleName &&
        roleId == other.roleId &&
        organizationId == other.organizationId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, roleName.hashCode);
    _$hash = $jc(_$hash, roleId.hashCode);
    _$hash = $jc(_$hash, organizationId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RoleAssignmentDto')
          ..add('roleName', roleName)
          ..add('roleId', roleId)
          ..add('organizationId', organizationId))
        .toString();
  }
}

class RoleAssignmentDtoBuilder
    implements Builder<RoleAssignmentDto, RoleAssignmentDtoBuilder> {
  _$RoleAssignmentDto? _$v;

  String? _roleName;
  String? get roleName => _$this._roleName;
  set roleName(String? roleName) => _$this._roleName = roleName;

  String? _roleId;
  String? get roleId => _$this._roleId;
  set roleId(String? roleId) => _$this._roleId = roleId;

  String? _organizationId;
  String? get organizationId => _$this._organizationId;
  set organizationId(String? organizationId) =>
      _$this._organizationId = organizationId;

  RoleAssignmentDtoBuilder() {
    RoleAssignmentDto._defaults(this);
  }

  RoleAssignmentDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _roleName = $v.roleName;
      _roleId = $v.roleId;
      _organizationId = $v.organizationId;
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
          roleName: BuiltValueNullFieldError.checkNotNull(
            roleName,
            r'RoleAssignmentDto',
            'roleName',
          ),
          roleId: BuiltValueNullFieldError.checkNotNull(
            roleId,
            r'RoleAssignmentDto',
            'roleId',
          ),
          organizationId: organizationId,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
