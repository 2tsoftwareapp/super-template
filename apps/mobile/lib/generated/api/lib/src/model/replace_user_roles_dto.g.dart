// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'replace_user_roles_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ReplaceUserRolesDto extends ReplaceUserRolesDto {
  @override
  final BuiltList<String> roleIds;

  factory _$ReplaceUserRolesDto(
          [void Function(ReplaceUserRolesDtoBuilder)? updates]) =>
      (ReplaceUserRolesDtoBuilder()..update(updates))._build();

  _$ReplaceUserRolesDto._({required this.roleIds}) : super._();
  @override
  ReplaceUserRolesDto rebuild(
          void Function(ReplaceUserRolesDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ReplaceUserRolesDtoBuilder toBuilder() =>
      ReplaceUserRolesDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ReplaceUserRolesDto && roleIds == other.roleIds;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, roleIds.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ReplaceUserRolesDto')
          ..add('roleIds', roleIds))
        .toString();
  }
}

class ReplaceUserRolesDtoBuilder
    implements Builder<ReplaceUserRolesDto, ReplaceUserRolesDtoBuilder> {
  _$ReplaceUserRolesDto? _$v;

  ListBuilder<String>? _roleIds;
  ListBuilder<String> get roleIds => _$this._roleIds ??= ListBuilder<String>();
  set roleIds(ListBuilder<String>? roleIds) => _$this._roleIds = roleIds;

  ReplaceUserRolesDtoBuilder() {
    ReplaceUserRolesDto._defaults(this);
  }

  ReplaceUserRolesDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _roleIds = $v.roleIds.toBuilder();
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
    _$ReplaceUserRolesDto _$result;
    try {
      _$result = _$v ??
          _$ReplaceUserRolesDto._(
            roleIds: roleIds.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'roleIds';
        roleIds.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ReplaceUserRolesDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
