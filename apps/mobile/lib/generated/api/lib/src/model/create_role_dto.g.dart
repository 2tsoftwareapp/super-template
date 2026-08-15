// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'create_role_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateRoleDto extends CreateRoleDto {
  @override
  final String name;
  @override
  final String? description;
  @override
  final String? organizationId;
  @override
  final BuiltList<String> permissionIds;

  factory _$CreateRoleDto([void Function(CreateRoleDtoBuilder)? updates]) =>
      (CreateRoleDtoBuilder()..update(updates))._build();

  _$CreateRoleDto._({
    required this.name,
    this.description,
    this.organizationId,
    required this.permissionIds,
  }) : super._();
  @override
  CreateRoleDto rebuild(void Function(CreateRoleDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateRoleDtoBuilder toBuilder() => CreateRoleDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateRoleDto &&
        name == other.name &&
        description == other.description &&
        organizationId == other.organizationId &&
        permissionIds == other.permissionIds;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jc(_$hash, organizationId.hashCode);
    _$hash = $jc(_$hash, permissionIds.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateRoleDto')
          ..add('name', name)
          ..add('description', description)
          ..add('organizationId', organizationId)
          ..add('permissionIds', permissionIds))
        .toString();
  }
}

class CreateRoleDtoBuilder
    implements Builder<CreateRoleDto, CreateRoleDtoBuilder> {
  _$CreateRoleDto? _$v;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _description;
  String? get description => _$this._description;
  set description(String? description) => _$this._description = description;

  String? _organizationId;
  String? get organizationId => _$this._organizationId;
  set organizationId(String? organizationId) =>
      _$this._organizationId = organizationId;

  ListBuilder<String>? _permissionIds;
  ListBuilder<String> get permissionIds =>
      _$this._permissionIds ??= ListBuilder<String>();
  set permissionIds(ListBuilder<String>? permissionIds) =>
      _$this._permissionIds = permissionIds;

  CreateRoleDtoBuilder() {
    CreateRoleDto._defaults(this);
  }

  CreateRoleDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _name = $v.name;
      _description = $v.description;
      _organizationId = $v.organizationId;
      _permissionIds = $v.permissionIds.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateRoleDto other) {
    _$v = other as _$CreateRoleDto;
  }

  @override
  void update(void Function(CreateRoleDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateRoleDto build() => _build();

  _$CreateRoleDto _build() {
    _$CreateRoleDto _$result;
    try {
      _$result = _$v ??
          _$CreateRoleDto._(
            name: BuiltValueNullFieldError.checkNotNull(
              name,
              r'CreateRoleDto',
              'name',
            ),
            description: description,
            organizationId: organizationId,
            permissionIds: permissionIds.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'permissionIds';
        permissionIds.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'CreateRoleDto',
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
