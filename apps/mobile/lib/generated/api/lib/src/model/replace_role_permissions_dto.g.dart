// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'replace_role_permissions_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ReplaceRolePermissionsDto extends ReplaceRolePermissionsDto {
  @override
  final BuiltList<String> permissionIds;

  factory _$ReplaceRolePermissionsDto([
    void Function(ReplaceRolePermissionsDtoBuilder)? updates,
  ]) =>
      (ReplaceRolePermissionsDtoBuilder()..update(updates))._build();

  _$ReplaceRolePermissionsDto._({required this.permissionIds}) : super._();
  @override
  ReplaceRolePermissionsDto rebuild(
    void Function(ReplaceRolePermissionsDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  ReplaceRolePermissionsDtoBuilder toBuilder() =>
      ReplaceRolePermissionsDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ReplaceRolePermissionsDto &&
        permissionIds == other.permissionIds;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, permissionIds.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'ReplaceRolePermissionsDto',
    )..add('permissionIds', permissionIds))
        .toString();
  }
}

class ReplaceRolePermissionsDtoBuilder
    implements
        Builder<ReplaceRolePermissionsDto, ReplaceRolePermissionsDtoBuilder> {
  _$ReplaceRolePermissionsDto? _$v;

  ListBuilder<String>? _permissionIds;
  ListBuilder<String> get permissionIds =>
      _$this._permissionIds ??= ListBuilder<String>();
  set permissionIds(ListBuilder<String>? permissionIds) =>
      _$this._permissionIds = permissionIds;

  ReplaceRolePermissionsDtoBuilder() {
    ReplaceRolePermissionsDto._defaults(this);
  }

  ReplaceRolePermissionsDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _permissionIds = $v.permissionIds.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ReplaceRolePermissionsDto other) {
    _$v = other as _$ReplaceRolePermissionsDto;
  }

  @override
  void update(void Function(ReplaceRolePermissionsDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ReplaceRolePermissionsDto build() => _build();

  _$ReplaceRolePermissionsDto _build() {
    _$ReplaceRolePermissionsDto _$result;
    try {
      _$result = _$v ??
          _$ReplaceRolePermissionsDto._(permissionIds: permissionIds.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'permissionIds';
        permissionIds.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'ReplaceRolePermissionsDto',
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
