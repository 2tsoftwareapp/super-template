// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'user_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const UserDtoStatusEnum _$userDtoStatusEnum_PENDING = const UserDtoStatusEnum._(
  'PENDING',
);
const UserDtoStatusEnum _$userDtoStatusEnum_ACTIVE = const UserDtoStatusEnum._(
  'ACTIVE',
);
const UserDtoStatusEnum _$userDtoStatusEnum_BLOCKED = const UserDtoStatusEnum._(
  'BLOCKED',
);

UserDtoStatusEnum _$userDtoStatusEnumValueOf(String name) {
  switch (name) {
    case 'PENDING':
      return _$userDtoStatusEnum_PENDING;
    case 'ACTIVE':
      return _$userDtoStatusEnum_ACTIVE;
    case 'BLOCKED':
      return _$userDtoStatusEnum_BLOCKED;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<UserDtoStatusEnum> _$userDtoStatusEnumValues =
    BuiltSet<UserDtoStatusEnum>(const <UserDtoStatusEnum>[
  _$userDtoStatusEnum_PENDING,
  _$userDtoStatusEnum_ACTIVE,
  _$userDtoStatusEnum_BLOCKED,
]);

Serializer<UserDtoStatusEnum> _$userDtoStatusEnumSerializer =
    _$UserDtoStatusEnumSerializer();

class _$UserDtoStatusEnumSerializer
    implements PrimitiveSerializer<UserDtoStatusEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'PENDING': 'PENDING',
    'ACTIVE': 'ACTIVE',
    'BLOCKED': 'BLOCKED',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'PENDING': 'PENDING',
    'ACTIVE': 'ACTIVE',
    'BLOCKED': 'BLOCKED',
  };

  @override
  final Iterable<Type> types = const <Type>[UserDtoStatusEnum];
  @override
  final String wireName = 'UserDtoStatusEnum';

  @override
  Object serialize(
    Serializers serializers,
    UserDtoStatusEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  UserDtoStatusEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      UserDtoStatusEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$UserDto extends UserDto {
  @override
  final String id;
  @override
  final String email;
  @override
  final String displayName;
  @override
  final JsonObject? avatarUrl;
  @override
  final UserDtoStatusEnum status;
  @override
  final String? emailVerifiedAt;
  @override
  final BuiltList<String> roles;
  @override
  final BuiltList<String> roleIds;
  @override
  final BuiltList<RoleAssignmentDto> roleAssignments;
  @override
  final BuiltList<String> memberOrganizationIds;
  @override
  final String createdAt;
  @override
  final String updatedAt;

  factory _$UserDto([void Function(UserDtoBuilder)? updates]) =>
      (UserDtoBuilder()..update(updates))._build();

  _$UserDto._({
    required this.id,
    required this.email,
    required this.displayName,
    this.avatarUrl,
    required this.status,
    this.emailVerifiedAt,
    required this.roles,
    required this.roleIds,
    required this.roleAssignments,
    required this.memberOrganizationIds,
    required this.createdAt,
    required this.updatedAt,
  }) : super._();
  @override
  UserDto rebuild(void Function(UserDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UserDtoBuilder toBuilder() => UserDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UserDto &&
        id == other.id &&
        email == other.email &&
        displayName == other.displayName &&
        avatarUrl == other.avatarUrl &&
        status == other.status &&
        emailVerifiedAt == other.emailVerifiedAt &&
        roles == other.roles &&
        roleIds == other.roleIds &&
        roleAssignments == other.roleAssignments &&
        memberOrganizationIds == other.memberOrganizationIds &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, email.hashCode);
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, avatarUrl.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, emailVerifiedAt.hashCode);
    _$hash = $jc(_$hash, roles.hashCode);
    _$hash = $jc(_$hash, roleIds.hashCode);
    _$hash = $jc(_$hash, roleAssignments.hashCode);
    _$hash = $jc(_$hash, memberOrganizationIds.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UserDto')
          ..add('id', id)
          ..add('email', email)
          ..add('displayName', displayName)
          ..add('avatarUrl', avatarUrl)
          ..add('status', status)
          ..add('emailVerifiedAt', emailVerifiedAt)
          ..add('roles', roles)
          ..add('roleIds', roleIds)
          ..add('roleAssignments', roleAssignments)
          ..add('memberOrganizationIds', memberOrganizationIds)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class UserDtoBuilder implements Builder<UserDto, UserDtoBuilder> {
  _$UserDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _email;
  String? get email => _$this._email;
  set email(String? email) => _$this._email = email;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  JsonObject? _avatarUrl;
  JsonObject? get avatarUrl => _$this._avatarUrl;
  set avatarUrl(JsonObject? avatarUrl) => _$this._avatarUrl = avatarUrl;

  UserDtoStatusEnum? _status;
  UserDtoStatusEnum? get status => _$this._status;
  set status(UserDtoStatusEnum? status) => _$this._status = status;

  String? _emailVerifiedAt;
  String? get emailVerifiedAt => _$this._emailVerifiedAt;
  set emailVerifiedAt(String? emailVerifiedAt) =>
      _$this._emailVerifiedAt = emailVerifiedAt;

  ListBuilder<String>? _roles;
  ListBuilder<String> get roles => _$this._roles ??= ListBuilder<String>();
  set roles(ListBuilder<String>? roles) => _$this._roles = roles;

  ListBuilder<String>? _roleIds;
  ListBuilder<String> get roleIds => _$this._roleIds ??= ListBuilder<String>();
  set roleIds(ListBuilder<String>? roleIds) => _$this._roleIds = roleIds;

  ListBuilder<RoleAssignmentDto>? _roleAssignments;
  ListBuilder<RoleAssignmentDto> get roleAssignments =>
      _$this._roleAssignments ??= ListBuilder<RoleAssignmentDto>();
  set roleAssignments(ListBuilder<RoleAssignmentDto>? roleAssignments) =>
      _$this._roleAssignments = roleAssignments;

  ListBuilder<String>? _memberOrganizationIds;
  ListBuilder<String> get memberOrganizationIds =>
      _$this._memberOrganizationIds ??= ListBuilder<String>();
  set memberOrganizationIds(ListBuilder<String>? memberOrganizationIds) =>
      _$this._memberOrganizationIds = memberOrganizationIds;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  UserDtoBuilder() {
    UserDto._defaults(this);
  }

  UserDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _email = $v.email;
      _displayName = $v.displayName;
      _avatarUrl = $v.avatarUrl;
      _status = $v.status;
      _emailVerifiedAt = $v.emailVerifiedAt;
      _roles = $v.roles.toBuilder();
      _roleIds = $v.roleIds.toBuilder();
      _roleAssignments = $v.roleAssignments.toBuilder();
      _memberOrganizationIds = $v.memberOrganizationIds.toBuilder();
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UserDto other) {
    _$v = other as _$UserDto;
  }

  @override
  void update(void Function(UserDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UserDto build() => _build();

  _$UserDto _build() {
    _$UserDto _$result;
    try {
      _$result = _$v ??
          _$UserDto._(
            id: BuiltValueNullFieldError.checkNotNull(id, r'UserDto', 'id'),
            email: BuiltValueNullFieldError.checkNotNull(
              email,
              r'UserDto',
              'email',
            ),
            displayName: BuiltValueNullFieldError.checkNotNull(
              displayName,
              r'UserDto',
              'displayName',
            ),
            avatarUrl: avatarUrl,
            status: BuiltValueNullFieldError.checkNotNull(
              status,
              r'UserDto',
              'status',
            ),
            emailVerifiedAt: emailVerifiedAt,
            roles: roles.build(),
            roleIds: roleIds.build(),
            roleAssignments: roleAssignments.build(),
            memberOrganizationIds: memberOrganizationIds.build(),
            createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt,
              r'UserDto',
              'createdAt',
            ),
            updatedAt: BuiltValueNullFieldError.checkNotNull(
              updatedAt,
              r'UserDto',
              'updatedAt',
            ),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'roles';
        roles.build();
        _$failedField = 'roleIds';
        roleIds.build();
        _$failedField = 'roleAssignments';
        roleAssignments.build();
        _$failedField = 'memberOrganizationIds';
        memberOrganizationIds.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'UserDto',
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
