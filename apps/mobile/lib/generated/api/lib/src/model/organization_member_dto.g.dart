// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'organization_member_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const OrganizationMemberDtoRoleEnum _$organizationMemberDtoRoleEnum_OWNER =
    const OrganizationMemberDtoRoleEnum._('OWNER');
const OrganizationMemberDtoRoleEnum _$organizationMemberDtoRoleEnum_ADMIN =
    const OrganizationMemberDtoRoleEnum._('ADMIN');
const OrganizationMemberDtoRoleEnum _$organizationMemberDtoRoleEnum_MEMBER =
    const OrganizationMemberDtoRoleEnum._('MEMBER');

OrganizationMemberDtoRoleEnum _$organizationMemberDtoRoleEnumValueOf(
  String name,
) {
  switch (name) {
    case 'OWNER':
      return _$organizationMemberDtoRoleEnum_OWNER;
    case 'ADMIN':
      return _$organizationMemberDtoRoleEnum_ADMIN;
    case 'MEMBER':
      return _$organizationMemberDtoRoleEnum_MEMBER;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<OrganizationMemberDtoRoleEnum>
    _$organizationMemberDtoRoleEnumValues =
    BuiltSet<OrganizationMemberDtoRoleEnum>(
  const <OrganizationMemberDtoRoleEnum>[
    _$organizationMemberDtoRoleEnum_OWNER,
    _$organizationMemberDtoRoleEnum_ADMIN,
    _$organizationMemberDtoRoleEnum_MEMBER,
  ],
);

Serializer<OrganizationMemberDtoRoleEnum>
    _$organizationMemberDtoRoleEnumSerializer =
    _$OrganizationMemberDtoRoleEnumSerializer();

class _$OrganizationMemberDtoRoleEnumSerializer
    implements PrimitiveSerializer<OrganizationMemberDtoRoleEnum> {
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
  final Iterable<Type> types = const <Type>[OrganizationMemberDtoRoleEnum];
  @override
  final String wireName = 'OrganizationMemberDtoRoleEnum';

  @override
  Object serialize(
    Serializers serializers,
    OrganizationMemberDtoRoleEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  OrganizationMemberDtoRoleEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      OrganizationMemberDtoRoleEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$OrganizationMemberDto extends OrganizationMemberDto {
  @override
  final String createdAt;
  @override
  final String displayName;
  @override
  final String email;
  @override
  final OrganizationMemberDtoRoleEnum role;
  @override
  final String updatedAt;
  @override
  final String userId;

  factory _$OrganizationMemberDto([
    void Function(OrganizationMemberDtoBuilder)? updates,
  ]) =>
      (OrganizationMemberDtoBuilder()..update(updates))._build();

  _$OrganizationMemberDto._({
    required this.createdAt,
    required this.displayName,
    required this.email,
    required this.role,
    required this.updatedAt,
    required this.userId,
  }) : super._();
  @override
  OrganizationMemberDto rebuild(
    void Function(OrganizationMemberDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  OrganizationMemberDtoBuilder toBuilder() =>
      OrganizationMemberDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is OrganizationMemberDto &&
        createdAt == other.createdAt &&
        displayName == other.displayName &&
        email == other.email &&
        role == other.role &&
        updatedAt == other.updatedAt &&
        userId == other.userId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, email.hashCode);
    _$hash = $jc(_$hash, role.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jc(_$hash, userId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'OrganizationMemberDto')
          ..add('createdAt', createdAt)
          ..add('displayName', displayName)
          ..add('email', email)
          ..add('role', role)
          ..add('updatedAt', updatedAt)
          ..add('userId', userId))
        .toString();
  }
}

class OrganizationMemberDtoBuilder
    implements Builder<OrganizationMemberDto, OrganizationMemberDtoBuilder> {
  _$OrganizationMemberDto? _$v;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  String? _email;
  String? get email => _$this._email;
  set email(String? email) => _$this._email = email;

  OrganizationMemberDtoRoleEnum? _role;
  OrganizationMemberDtoRoleEnum? get role => _$this._role;
  set role(OrganizationMemberDtoRoleEnum? role) => _$this._role = role;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  String? _userId;
  String? get userId => _$this._userId;
  set userId(String? userId) => _$this._userId = userId;

  OrganizationMemberDtoBuilder() {
    OrganizationMemberDto._defaults(this);
  }

  OrganizationMemberDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _createdAt = $v.createdAt;
      _displayName = $v.displayName;
      _email = $v.email;
      _role = $v.role;
      _updatedAt = $v.updatedAt;
      _userId = $v.userId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(OrganizationMemberDto other) {
    _$v = other as _$OrganizationMemberDto;
  }

  @override
  void update(void Function(OrganizationMemberDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  OrganizationMemberDto build() => _build();

  _$OrganizationMemberDto _build() {
    final _$result = _$v ??
        _$OrganizationMemberDto._(
          createdAt: BuiltValueNullFieldError.checkNotNull(
            createdAt,
            r'OrganizationMemberDto',
            'createdAt',
          ),
          displayName: BuiltValueNullFieldError.checkNotNull(
            displayName,
            r'OrganizationMemberDto',
            'displayName',
          ),
          email: BuiltValueNullFieldError.checkNotNull(
            email,
            r'OrganizationMemberDto',
            'email',
          ),
          role: BuiltValueNullFieldError.checkNotNull(
            role,
            r'OrganizationMemberDto',
            'role',
          ),
          updatedAt: BuiltValueNullFieldError.checkNotNull(
            updatedAt,
            r'OrganizationMemberDto',
            'updatedAt',
          ),
          userId: BuiltValueNullFieldError.checkNotNull(
            userId,
            r'OrganizationMemberDto',
            'userId',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
