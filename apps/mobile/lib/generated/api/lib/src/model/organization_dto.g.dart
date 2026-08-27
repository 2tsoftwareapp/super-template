// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'organization_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const OrganizationDtoRoleEnum _$organizationDtoRoleEnum_OWNER =
    const OrganizationDtoRoleEnum._('OWNER');
const OrganizationDtoRoleEnum _$organizationDtoRoleEnum_ADMIN =
    const OrganizationDtoRoleEnum._('ADMIN');
const OrganizationDtoRoleEnum _$organizationDtoRoleEnum_MEMBER =
    const OrganizationDtoRoleEnum._('MEMBER');

OrganizationDtoRoleEnum _$organizationDtoRoleEnumValueOf(String name) {
  switch (name) {
    case 'OWNER':
      return _$organizationDtoRoleEnum_OWNER;
    case 'ADMIN':
      return _$organizationDtoRoleEnum_ADMIN;
    case 'MEMBER':
      return _$organizationDtoRoleEnum_MEMBER;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<OrganizationDtoRoleEnum> _$organizationDtoRoleEnumValues =
    BuiltSet<OrganizationDtoRoleEnum>(const <OrganizationDtoRoleEnum>[
  _$organizationDtoRoleEnum_OWNER,
  _$organizationDtoRoleEnum_ADMIN,
  _$organizationDtoRoleEnum_MEMBER,
]);

Serializer<OrganizationDtoRoleEnum> _$organizationDtoRoleEnumSerializer =
    _$OrganizationDtoRoleEnumSerializer();

class _$OrganizationDtoRoleEnumSerializer
    implements PrimitiveSerializer<OrganizationDtoRoleEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'OWNER': 'OWNER',
    'ADMIN': 'ADMIN',
    'MEMBER': 'MEMBER',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'OWNER': 'OWNER',
    'ADMIN': 'ADMIN',
    'MEMBER': 'MEMBER',
  };

  @override
  final Iterable<Type> types = const <Type>[OrganizationDtoRoleEnum];
  @override
  final String wireName = 'OrganizationDtoRoleEnum';

  @override
  Object serialize(
    Serializers serializers,
    OrganizationDtoRoleEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  OrganizationDtoRoleEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      OrganizationDtoRoleEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$OrganizationDto extends OrganizationDto {
  @override
  final String createdAt;
  @override
  final bool current;
  @override
  final String id;
  @override
  final String name;
  @override
  final OrganizationDtoRoleEnum role;
  @override
  final String slug;
  @override
  final String updatedAt;

  factory _$OrganizationDto([void Function(OrganizationDtoBuilder)? updates]) =>
      (OrganizationDtoBuilder()..update(updates))._build();

  _$OrganizationDto._({
    required this.createdAt,
    required this.current,
    required this.id,
    required this.name,
    required this.role,
    required this.slug,
    required this.updatedAt,
  }) : super._();
  @override
  OrganizationDto rebuild(void Function(OrganizationDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  OrganizationDtoBuilder toBuilder() => OrganizationDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is OrganizationDto &&
        createdAt == other.createdAt &&
        current == other.current &&
        id == other.id &&
        name == other.name &&
        role == other.role &&
        slug == other.slug &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, current.hashCode);
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, role.hashCode);
    _$hash = $jc(_$hash, slug.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'OrganizationDto')
          ..add('createdAt', createdAt)
          ..add('current', current)
          ..add('id', id)
          ..add('name', name)
          ..add('role', role)
          ..add('slug', slug)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class OrganizationDtoBuilder
    implements Builder<OrganizationDto, OrganizationDtoBuilder> {
  _$OrganizationDto? _$v;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  bool? _current;
  bool? get current => _$this._current;
  set current(bool? current) => _$this._current = current;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  OrganizationDtoRoleEnum? _role;
  OrganizationDtoRoleEnum? get role => _$this._role;
  set role(OrganizationDtoRoleEnum? role) => _$this._role = role;

  String? _slug;
  String? get slug => _$this._slug;
  set slug(String? slug) => _$this._slug = slug;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  OrganizationDtoBuilder() {
    OrganizationDto._defaults(this);
  }

  OrganizationDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _createdAt = $v.createdAt;
      _current = $v.current;
      _id = $v.id;
      _name = $v.name;
      _role = $v.role;
      _slug = $v.slug;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(OrganizationDto other) {
    _$v = other as _$OrganizationDto;
  }

  @override
  void update(void Function(OrganizationDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  OrganizationDto build() => _build();

  _$OrganizationDto _build() {
    final _$result = _$v ??
        _$OrganizationDto._(
          createdAt: BuiltValueNullFieldError.checkNotNull(
            createdAt,
            r'OrganizationDto',
            'createdAt',
          ),
          current: BuiltValueNullFieldError.checkNotNull(
            current,
            r'OrganizationDto',
            'current',
          ),
          id: BuiltValueNullFieldError.checkNotNull(
            id,
            r'OrganizationDto',
            'id',
          ),
          name: BuiltValueNullFieldError.checkNotNull(
            name,
            r'OrganizationDto',
            'name',
          ),
          role: BuiltValueNullFieldError.checkNotNull(
            role,
            r'OrganizationDto',
            'role',
          ),
          slug: BuiltValueNullFieldError.checkNotNull(
            slug,
            r'OrganizationDto',
            'slug',
          ),
          updatedAt: BuiltValueNullFieldError.checkNotNull(
            updatedAt,
            r'OrganizationDto',
            'updatedAt',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
