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
  final String id;
  @override
  final JsonObject? organizationId;
  @override
  final String name;
  @override
  final JsonObject? description;
  @override
  final RoleDtoScopeEnum scope;
  @override
  final bool isSystem;
  @override
  final BuiltList<PermissionDto> permissions;

  factory _$RoleDto([void Function(RoleDtoBuilder)? updates]) =>
      (RoleDtoBuilder()..update(updates))._build();

  _$RoleDto._({
    required this.id,
    this.organizationId,
    required this.name,
    this.description,
    required this.scope,
    required this.isSystem,
    required this.permissions,
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
        id == other.id &&
        organizationId == other.organizationId &&
        name == other.name &&
        description == other.description &&
        scope == other.scope &&
        isSystem == other.isSystem &&
        permissions == other.permissions;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, organizationId.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jc(_$hash, scope.hashCode);
    _$hash = $jc(_$hash, isSystem.hashCode);
    _$hash = $jc(_$hash, permissions.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RoleDto')
          ..add('id', id)
          ..add('organizationId', organizationId)
          ..add('name', name)
          ..add('description', description)
          ..add('scope', scope)
          ..add('isSystem', isSystem)
          ..add('permissions', permissions))
        .toString();
  }
}

class RoleDtoBuilder implements Builder<RoleDto, RoleDtoBuilder> {
  _$RoleDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  JsonObject? _organizationId;
  JsonObject? get organizationId => _$this._organizationId;
  set organizationId(JsonObject? organizationId) =>
      _$this._organizationId = organizationId;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  JsonObject? _description;
  JsonObject? get description => _$this._description;
  set description(JsonObject? description) => _$this._description = description;

  RoleDtoScopeEnum? _scope;
  RoleDtoScopeEnum? get scope => _$this._scope;
  set scope(RoleDtoScopeEnum? scope) => _$this._scope = scope;

  bool? _isSystem;
  bool? get isSystem => _$this._isSystem;
  set isSystem(bool? isSystem) => _$this._isSystem = isSystem;

  ListBuilder<PermissionDto>? _permissions;
  ListBuilder<PermissionDto> get permissions =>
      _$this._permissions ??= ListBuilder<PermissionDto>();
  set permissions(ListBuilder<PermissionDto>? permissions) =>
      _$this._permissions = permissions;

  RoleDtoBuilder() {
    RoleDto._defaults(this);
  }

  RoleDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _organizationId = $v.organizationId;
      _name = $v.name;
      _description = $v.description;
      _scope = $v.scope;
      _isSystem = $v.isSystem;
      _permissions = $v.permissions.toBuilder();
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
            id: BuiltValueNullFieldError.checkNotNull(id, r'RoleDto', 'id'),
            organizationId: organizationId,
            name: BuiltValueNullFieldError.checkNotNull(
              name,
              r'RoleDto',
              'name',
            ),
            description: description,
            scope: BuiltValueNullFieldError.checkNotNull(
              scope,
              r'RoleDto',
              'scope',
            ),
            isSystem: BuiltValueNullFieldError.checkNotNull(
              isSystem,
              r'RoleDto',
              'isSystem',
            ),
            permissions: permissions.build(),
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
