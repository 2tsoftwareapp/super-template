// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'role_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const RoleDtoScopeEnum _$roleDtoScopeEnum_platform = const RoleDtoScopeEnum._(
  'platform',
);
const RoleDtoScopeEnum _$roleDtoScopeEnum_organization =
    const RoleDtoScopeEnum._('organization');

RoleDtoScopeEnum _$roleDtoScopeEnumValueOf(String name) {
  switch (name) {
    case 'platform':
      return _$roleDtoScopeEnum_platform;
    case 'organization':
      return _$roleDtoScopeEnum_organization;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<RoleDtoScopeEnum> _$roleDtoScopeEnumValues =
    BuiltSet<RoleDtoScopeEnum>(const <RoleDtoScopeEnum>[
  _$roleDtoScopeEnum_platform,
  _$roleDtoScopeEnum_organization,
]);

Serializer<RoleDtoScopeEnum> _$roleDtoScopeEnumSerializer =
    _$RoleDtoScopeEnumSerializer();

class _$RoleDtoScopeEnumSerializer
    implements PrimitiveSerializer<RoleDtoScopeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'platform': 'platform',
    'organization': 'organization',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'platform': 'platform',
    'organization': 'organization',
  };

  @override
  final Iterable<Type> types = const <Type>[RoleDtoScopeEnum];
  @override
  final String wireName = 'RoleDtoScopeEnum';

  @override
  Object serialize(
    Serializers serializers,
    RoleDtoScopeEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  RoleDtoScopeEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      RoleDtoScopeEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$RoleDto extends RoleDto {
  @override
  final String? description;
  @override
  final String id;
  @override
  final bool isSystem;
  @override
  final String name;
  @override
  final String? organizationId;
  @override
  final BuiltList<PermissionDto> permissions;
  @override
  final RoleDtoScopeEnum scope;

  factory _$RoleDto([void Function(RoleDtoBuilder)? updates]) =>
      (RoleDtoBuilder()..update(updates))._build();

  _$RoleDto._({
    this.description,
    required this.id,
    required this.isSystem,
    required this.name,
    this.organizationId,
    required this.permissions,
    required this.scope,
  }) : super._();
  @override
  RoleDto rebuild(void Function(RoleDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  RoleDtoBuilder toBuilder() => RoleDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RoleDto &&
        description == other.description &&
        id == other.id &&
        isSystem == other.isSystem &&
        name == other.name &&
        organizationId == other.organizationId &&
        permissions == other.permissions &&
        scope == other.scope;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, isSystem.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, organizationId.hashCode);
    _$hash = $jc(_$hash, permissions.hashCode);
    _$hash = $jc(_$hash, scope.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RoleDto')
          ..add('description', description)
          ..add('id', id)
          ..add('isSystem', isSystem)
          ..add('name', name)
          ..add('organizationId', organizationId)
          ..add('permissions', permissions)
          ..add('scope', scope))
        .toString();
  }
}

class RoleDtoBuilder implements Builder<RoleDto, RoleDtoBuilder> {
  _$RoleDto? _$v;

  String? _description;
  String? get description => _$this._description;
  set description(String? description) => _$this._description = description;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  bool? _isSystem;
  bool? get isSystem => _$this._isSystem;
  set isSystem(bool? isSystem) => _$this._isSystem = isSystem;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _organizationId;
  String? get organizationId => _$this._organizationId;
  set organizationId(String? organizationId) =>
      _$this._organizationId = organizationId;

  ListBuilder<PermissionDto>? _permissions;
  ListBuilder<PermissionDto> get permissions =>
      _$this._permissions ??= ListBuilder<PermissionDto>();
  set permissions(ListBuilder<PermissionDto>? permissions) =>
      _$this._permissions = permissions;

  RoleDtoScopeEnum? _scope;
  RoleDtoScopeEnum? get scope => _$this._scope;
  set scope(RoleDtoScopeEnum? scope) => _$this._scope = scope;

  RoleDtoBuilder() {
    RoleDto._defaults(this);
  }

  RoleDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _description = $v.description;
      _id = $v.id;
      _isSystem = $v.isSystem;
      _name = $v.name;
      _organizationId = $v.organizationId;
      _permissions = $v.permissions.toBuilder();
      _scope = $v.scope;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RoleDto other) {
    _$v = other as _$RoleDto;
  }

  @override
  void update(void Function(RoleDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RoleDto build() => _build();

  _$RoleDto _build() {
    _$RoleDto _$result;
    try {
      _$result = _$v ??
          _$RoleDto._(
            description: description,
            id: BuiltValueNullFieldError.checkNotNull(id, r'RoleDto', 'id'),
            isSystem: BuiltValueNullFieldError.checkNotNull(
              isSystem,
              r'RoleDto',
              'isSystem',
            ),
            name: BuiltValueNullFieldError.checkNotNull(
              name,
              r'RoleDto',
              'name',
            ),
            organizationId: organizationId,
            permissions: permissions.build(),
            scope: BuiltValueNullFieldError.checkNotNull(
              scope,
              r'RoleDto',
              'scope',
            ),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'permissions';
        permissions.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'RoleDto',
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
