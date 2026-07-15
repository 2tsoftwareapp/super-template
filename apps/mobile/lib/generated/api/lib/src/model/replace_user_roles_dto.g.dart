// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'replace_user_roles_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ReplaceUserRolesDto extends ReplaceUserRolesDto {
  @override
  final String role;
  @override
  final String? organizationId;

  factory _$ReplaceUserRolesDto([
    void Function(ReplaceUserRolesDtoBuilder)? updates,
  ]) =>
      (ReplaceUserRolesDtoBuilder()..update(updates))._build();

  _$ReplaceUserRolesDto._({required this.role, this.organizationId})
      : super._();
  @override
  ReplaceUserRolesDto rebuild(
    void Function(ReplaceUserRolesDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  ReplaceUserRolesDtoBuilder toBuilder() =>
      ReplaceUserRolesDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ReplaceUserRolesDto &&
        role == other.role &&
        organizationId == other.organizationId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, role.hashCode);
    _$hash = $jc(_$hash, organizationId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ReplaceUserRolesDto')
          ..add('role', role)
          ..add('organizationId', organizationId))
        .toString();
  }
}

class ReplaceUserRolesDtoBuilder
    implements Builder<ReplaceUserRolesDto, ReplaceUserRolesDtoBuilder> {
  _$ReplaceUserRolesDto? _$v;

  String? _role;
  String? get role => _$this._role;
  set role(String? role) => _$this._role = role;

  String? _organizationId;
  String? get organizationId => _$this._organizationId;
  set organizationId(String? organizationId) =>
      _$this._organizationId = organizationId;

  ReplaceUserRolesDtoBuilder() {
    ReplaceUserRolesDto._defaults(this);
  }

  ReplaceUserRolesDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _role = $v.role;
      _organizationId = $v.organizationId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ReplaceUserRolesDto other) {
    _$v = other as _$ReplaceUserRolesDto;
  }

  @override
  void update(void Function(ReplaceUserRolesDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ReplaceUserRolesDto build() => _build();

  _$ReplaceUserRolesDto _build() {
    final _$result = _$v ??
        _$ReplaceUserRolesDto._(
          role: BuiltValueNullFieldError.checkNotNull(
            role,
            r'ReplaceUserRolesDto',
            'role',
          ),
          organizationId: organizationId,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
