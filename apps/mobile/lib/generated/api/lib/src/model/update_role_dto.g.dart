// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'update_role_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdateRoleDto extends UpdateRoleDto {
  @override
  final String? description;
  @override
  final String? name;
  @override
  final BuiltList<String>? permissionIds;

  factory _$UpdateRoleDto([void Function(UpdateRoleDtoBuilder)? updates]) =>
      (UpdateRoleDtoBuilder()..update(updates))._build();

  _$UpdateRoleDto._({this.description, this.name, this.permissionIds})
      : super._();
  @override
  UpdateRoleDto rebuild(void Function(UpdateRoleDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateRoleDtoBuilder toBuilder() => UpdateRoleDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateRoleDto &&
        description == other.description &&
        name == other.name &&
        permissionIds == other.permissionIds;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, permissionIds.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdateRoleDto')
          ..add('description', description)
          ..add('name', name)
          ..add('permissionIds', permissionIds))
        .toString();
  }
}

class UpdateRoleDtoBuilder
    implements Builder<UpdateRoleDto, UpdateRoleDtoBuilder> {
  _$UpdateRoleDto? _$v;

  String? _description;
  String? get description => _$this._description;
  set description(String? description) => _$this._description = description;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  ListBuilder<String>? _permissionIds;
  ListBuilder<String> get permissionIds =>
      _$this._permissionIds ??= ListBuilder<String>();
  set permissionIds(ListBuilder<String>? permissionIds) =>
      _$this._permissionIds = permissionIds;

  UpdateRoleDtoBuilder() {
    UpdateRoleDto._defaults(this);
  }

  UpdateRoleDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _description = $v.description;
      _name = $v.name;
      _permissionIds = $v.permissionIds?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateRoleDto other) {
    _$v = other as _$UpdateRoleDto;
  }

  @override
  void update(void Function(UpdateRoleDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateRoleDto build() => _build();

  _$UpdateRoleDto _build() {
    _$UpdateRoleDto _$result;
    try {
      _$result = _$v ??
          _$UpdateRoleDto._(
            description: description,
            name: name,
            permissionIds: _permissionIds?.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'permissionIds';
        _permissionIds?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'UpdateRoleDto',
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
