// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'organization_detail_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const OrganizationDetailDtoRoleEnum _$organizationDetailDtoRoleEnum_OWNER =
    const OrganizationDetailDtoRoleEnum._('OWNER');
const OrganizationDetailDtoRoleEnum _$organizationDetailDtoRoleEnum_ADMIN =
    const OrganizationDetailDtoRoleEnum._('ADMIN');
const OrganizationDetailDtoRoleEnum _$organizationDetailDtoRoleEnum_MEMBER =
    const OrganizationDetailDtoRoleEnum._('MEMBER');

OrganizationDetailDtoRoleEnum _$organizationDetailDtoRoleEnumValueOf(
  String name,
) {
  switch (name) {
    case 'OWNER':
      return _$organizationDetailDtoRoleEnum_OWNER;
    case 'ADMIN':
      return _$organizationDetailDtoRoleEnum_ADMIN;
    case 'MEMBER':
      return _$organizationDetailDtoRoleEnum_MEMBER;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<OrganizationDetailDtoRoleEnum>
    _$organizationDetailDtoRoleEnumValues =
    BuiltSet<OrganizationDetailDtoRoleEnum>(
  const <OrganizationDetailDtoRoleEnum>[
    _$organizationDetailDtoRoleEnum_OWNER,
    _$organizationDetailDtoRoleEnum_ADMIN,
    _$organizationDetailDtoRoleEnum_MEMBER,
  ],
);

Serializer<OrganizationDetailDtoRoleEnum>
    _$organizationDetailDtoRoleEnumSerializer =
    _$OrganizationDetailDtoRoleEnumSerializer();

class _$OrganizationDetailDtoRoleEnumSerializer
    implements PrimitiveSerializer<OrganizationDetailDtoRoleEnum> {
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
  final Iterable<Type> types = const <Type>[OrganizationDetailDtoRoleEnum];
  @override
  final String wireName = 'OrganizationDetailDtoRoleEnum';

  @override
  Object serialize(
    Serializers serializers,
    OrganizationDetailDtoRoleEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  OrganizationDetailDtoRoleEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      OrganizationDetailDtoRoleEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$OrganizationDetailDto extends OrganizationDetailDto {
  @override
  final String createdAt;
  @override
  final String id;
  @override
  final num memberCount;
  @override
  final String name;
  @override
  final OrganizationDetailDtoRoleEnum role;
  @override
  final String slug;
  @override
  final String updatedAt;

  factory _$OrganizationDetailDto([
    void Function(OrganizationDetailDtoBuilder)? updates,
  ]) =>
      (OrganizationDetailDtoBuilder()..update(updates))._build();

  _$OrganizationDetailDto._({
    required this.createdAt,
    required this.id,
    required this.memberCount,
    required this.name,
    required this.role,
    required this.slug,
    required this.updatedAt,
  }) : super._();
  @override
  OrganizationDetailDto rebuild(
    void Function(OrganizationDetailDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  OrganizationDetailDtoBuilder toBuilder() =>
      OrganizationDetailDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is OrganizationDetailDto &&
        createdAt == other.createdAt &&
        id == other.id &&
        memberCount == other.memberCount &&
        name == other.name &&
        role == other.role &&
        slug == other.slug &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, memberCount.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, role.hashCode);
    _$hash = $jc(_$hash, slug.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'OrganizationDetailDto')
          ..add('createdAt', createdAt)
          ..add('id', id)
          ..add('memberCount', memberCount)
          ..add('name', name)
          ..add('role', role)
          ..add('slug', slug)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class OrganizationDetailDtoBuilder
    implements Builder<OrganizationDetailDto, OrganizationDetailDtoBuilder> {
  _$OrganizationDetailDto? _$v;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  num? _memberCount;
  num? get memberCount => _$this._memberCount;
  set memberCount(num? memberCount) => _$this._memberCount = memberCount;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  OrganizationDetailDtoRoleEnum? _role;
  OrganizationDetailDtoRoleEnum? get role => _$this._role;
  set role(OrganizationDetailDtoRoleEnum? role) => _$this._role = role;

  String? _slug;
  String? get slug => _$this._slug;
  set slug(String? slug) => _$this._slug = slug;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  OrganizationDetailDtoBuilder() {
    OrganizationDetailDto._defaults(this);
  }

  OrganizationDetailDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _createdAt = $v.createdAt;
      _id = $v.id;
      _memberCount = $v.memberCount;
      _name = $v.name;
      _role = $v.role;
      _slug = $v.slug;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(OrganizationDetailDto other) {
    _$v = other as _$OrganizationDetailDto;
  }

  @override
  void update(void Function(OrganizationDetailDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  OrganizationDetailDto build() => _build();

  _$OrganizationDetailDto _build() {
    final _$result = _$v ??
        _$OrganizationDetailDto._(
          createdAt: BuiltValueNullFieldError.checkNotNull(
            createdAt,
            r'OrganizationDetailDto',
            'createdAt',
          ),
          id: BuiltValueNullFieldError.checkNotNull(
            id,
            r'OrganizationDetailDto',
            'id',
          ),
          memberCount: BuiltValueNullFieldError.checkNotNull(
            memberCount,
            r'OrganizationDetailDto',
            'memberCount',
          ),
          name: BuiltValueNullFieldError.checkNotNull(
            name,
            r'OrganizationDetailDto',
            'name',
          ),
          role: BuiltValueNullFieldError.checkNotNull(
            role,
            r'OrganizationDetailDto',
            'role',
          ),
          slug: BuiltValueNullFieldError.checkNotNull(
            slug,
            r'OrganizationDetailDto',
            'slug',
          ),
          updatedAt: BuiltValueNullFieldError.checkNotNull(
            updatedAt,
            r'OrganizationDetailDto',
            'updatedAt',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
