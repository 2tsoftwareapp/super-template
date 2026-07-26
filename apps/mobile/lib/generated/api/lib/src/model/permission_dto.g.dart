// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'permission_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const PermissionDtoScopeEnum _$permissionDtoScopeEnum_platform =
    const PermissionDtoScopeEnum._('platform');
const PermissionDtoScopeEnum _$permissionDtoScopeEnum_organization =
    const PermissionDtoScopeEnum._('organization');

PermissionDtoScopeEnum _$permissionDtoScopeEnumValueOf(String name) {
  switch (name) {
    case 'platform':
      return _$permissionDtoScopeEnum_platform;
    case 'organization':
      return _$permissionDtoScopeEnum_organization;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<PermissionDtoScopeEnum> _$permissionDtoScopeEnumValues =
    BuiltSet<PermissionDtoScopeEnum>(const <PermissionDtoScopeEnum>[
  _$permissionDtoScopeEnum_platform,
  _$permissionDtoScopeEnum_organization,
]);

Serializer<PermissionDtoScopeEnum> _$permissionDtoScopeEnumSerializer =
    _$PermissionDtoScopeEnumSerializer();

class _$PermissionDtoScopeEnumSerializer
    implements PrimitiveSerializer<PermissionDtoScopeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'platform': 'platform',
    'organization': 'organization',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'platform': 'platform',
    'organization': 'organization',
  };

  @override
  final Iterable<Type> types = const <Type>[PermissionDtoScopeEnum];
  @override
  final String wireName = 'PermissionDtoScopeEnum';

  @override
  Object serialize(
    Serializers serializers,
    PermissionDtoScopeEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  PermissionDtoScopeEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      PermissionDtoScopeEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$PermissionDto extends PermissionDto {
  @override
  final String id;
  @override
  final String name;
  @override
  final JsonObject? description;
  @override
  final bool isSystem;
  @override
  final PermissionDtoScopeEnum scope;

  factory _$PermissionDto([void Function(PermissionDtoBuilder)? updates]) =>
      (PermissionDtoBuilder()..update(updates))._build();

  _$PermissionDto._({
    required this.id,
    required this.name,
    this.description,
    required this.isSystem,
    required this.scope,
  }) : super._();
  @override
  PermissionDto rebuild(void Function(PermissionDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  PermissionDtoBuilder toBuilder() => PermissionDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is PermissionDto &&
        id == other.id &&
        name == other.name &&
        description == other.description &&
        isSystem == other.isSystem &&
        scope == other.scope;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jc(_$hash, isSystem.hashCode);
    _$hash = $jc(_$hash, scope.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'PermissionDto')
          ..add('id', id)
          ..add('name', name)
          ..add('description', description)
          ..add('isSystem', isSystem)
          ..add('scope', scope))
        .toString();
  }
}

class PermissionDtoBuilder
    implements Builder<PermissionDto, PermissionDtoBuilder> {
  _$PermissionDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  JsonObject? _description;
  JsonObject? get description => _$this._description;
  set description(JsonObject? description) => _$this._description = description;

  bool? _isSystem;
  bool? get isSystem => _$this._isSystem;
  set isSystem(bool? isSystem) => _$this._isSystem = isSystem;

  PermissionDtoScopeEnum? _scope;
  PermissionDtoScopeEnum? get scope => _$this._scope;
  set scope(PermissionDtoScopeEnum? scope) => _$this._scope = scope;

  PermissionDtoBuilder() {
    PermissionDto._defaults(this);
  }

  PermissionDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _name = $v.name;
      _description = $v.description;
      _isSystem = $v.isSystem;
      _scope = $v.scope;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(PermissionDto other) {
    _$v = other as _$PermissionDto;
  }

  @override
  void update(void Function(PermissionDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  PermissionDto build() => _build();

  _$PermissionDto _build() {
    final _$result = _$v ??
        _$PermissionDto._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'PermissionDto', 'id'),
          name: BuiltValueNullFieldError.checkNotNull(
            name,
            r'PermissionDto',
            'name',
          ),
          description: description,
          isSystem: BuiltValueNullFieldError.checkNotNull(
            isSystem,
            r'PermissionDto',
            'isSystem',
          ),
          scope: BuiltValueNullFieldError.checkNotNull(
            scope,
            r'PermissionDto',
            'scope',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
