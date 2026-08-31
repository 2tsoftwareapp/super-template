// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'user_organization_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const UserOrganizationDtoRoleEnum _$userOrganizationDtoRoleEnum_OWNER =
    const UserOrganizationDtoRoleEnum._('OWNER');
const UserOrganizationDtoRoleEnum _$userOrganizationDtoRoleEnum_ADMIN =
    const UserOrganizationDtoRoleEnum._('ADMIN');
const UserOrganizationDtoRoleEnum _$userOrganizationDtoRoleEnum_MEMBER =
    const UserOrganizationDtoRoleEnum._('MEMBER');

UserOrganizationDtoRoleEnum _$userOrganizationDtoRoleEnumValueOf(String name) {
  switch (name) {
    case 'OWNER':
      return _$userOrganizationDtoRoleEnum_OWNER;
    case 'ADMIN':
      return _$userOrganizationDtoRoleEnum_ADMIN;
    case 'MEMBER':
      return _$userOrganizationDtoRoleEnum_MEMBER;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<UserOrganizationDtoRoleEnum>
    _$userOrganizationDtoRoleEnumValues =
    BuiltSet<UserOrganizationDtoRoleEnum>(const <UserOrganizationDtoRoleEnum>[
  _$userOrganizationDtoRoleEnum_OWNER,
  _$userOrganizationDtoRoleEnum_ADMIN,
  _$userOrganizationDtoRoleEnum_MEMBER,
]);

Serializer<UserOrganizationDtoRoleEnum>
    _$userOrganizationDtoRoleEnumSerializer =
    _$UserOrganizationDtoRoleEnumSerializer();

class _$UserOrganizationDtoRoleEnumSerializer
    implements PrimitiveSerializer<UserOrganizationDtoRoleEnum> {
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
  final Iterable<Type> types = const <Type>[UserOrganizationDtoRoleEnum];
  @override
  final String wireName = 'UserOrganizationDtoRoleEnum';

  @override
  Object serialize(
    Serializers serializers,
    UserOrganizationDtoRoleEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  UserOrganizationDtoRoleEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      UserOrganizationDtoRoleEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$UserOrganizationDto extends UserOrganizationDto {
  @override
  final String createdAt;
  @override
  final bool current;
  @override
  final String id;
  @override
  final String name;
  @override
  final UserOrganizationDtoRoleEnum role;
  @override
  final String slug;
  @override
  final String updatedAt;

  factory _$UserOrganizationDto([
    void Function(UserOrganizationDtoBuilder)? updates,
  ]) =>
      (UserOrganizationDtoBuilder()..update(updates))._build();

  _$UserOrganizationDto._({
    required this.createdAt,
    required this.current,
    required this.id,
    required this.name,
    required this.role,
    required this.slug,
    required this.updatedAt,
  }) : super._();
  @override
  UserOrganizationDto rebuild(
    void Function(UserOrganizationDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  UserOrganizationDtoBuilder toBuilder() =>
      UserOrganizationDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UserOrganizationDto &&
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
    return (newBuiltValueToStringHelper(r'UserOrganizationDto')
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

class UserOrganizationDtoBuilder
    implements Builder<UserOrganizationDto, UserOrganizationDtoBuilder> {
  _$UserOrganizationDto? _$v;

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

  UserOrganizationDtoRoleEnum? _role;
  UserOrganizationDtoRoleEnum? get role => _$this._role;
  set role(UserOrganizationDtoRoleEnum? role) => _$this._role = role;

  String? _slug;
  String? get slug => _$this._slug;
  set slug(String? slug) => _$this._slug = slug;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  UserOrganizationDtoBuilder() {
    UserOrganizationDto._defaults(this);
  }

  UserOrganizationDtoBuilder get _$this {
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
  void replace(UserOrganizationDto other) {
    _$v = other as _$UserOrganizationDto;
  }

  @override
  void update(void Function(UserOrganizationDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UserOrganizationDto build() => _build();

  _$UserOrganizationDto _build() {
    final _$result = _$v ??
        _$UserOrganizationDto._(
          createdAt: BuiltValueNullFieldError.checkNotNull(
            createdAt,
            r'UserOrganizationDto',
            'createdAt',
          ),
          current: BuiltValueNullFieldError.checkNotNull(
            current,
            r'UserOrganizationDto',
            'current',
          ),
          id: BuiltValueNullFieldError.checkNotNull(
            id,
            r'UserOrganizationDto',
            'id',
          ),
          name: BuiltValueNullFieldError.checkNotNull(
            name,
            r'UserOrganizationDto',
            'name',
          ),
          role: BuiltValueNullFieldError.checkNotNull(
            role,
            r'UserOrganizationDto',
            'role',
          ),
          slug: BuiltValueNullFieldError.checkNotNull(
            slug,
            r'UserOrganizationDto',
            'slug',
          ),
          updatedAt: BuiltValueNullFieldError.checkNotNull(
            updatedAt,
            r'UserOrganizationDto',
            'updatedAt',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
