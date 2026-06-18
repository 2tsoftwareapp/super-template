// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'create_admin_user_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const CreateAdminUserDtoStatusEnum _$createAdminUserDtoStatusEnum_PENDING =
    const CreateAdminUserDtoStatusEnum._('PENDING');
const CreateAdminUserDtoStatusEnum _$createAdminUserDtoStatusEnum_ACTIVE =
    const CreateAdminUserDtoStatusEnum._('ACTIVE');
const CreateAdminUserDtoStatusEnum _$createAdminUserDtoStatusEnum_BLOCKED =
    const CreateAdminUserDtoStatusEnum._('BLOCKED');

CreateAdminUserDtoStatusEnum _$createAdminUserDtoStatusEnumValueOf(
  String name,
) {
  switch (name) {
    case 'PENDING':
      return _$createAdminUserDtoStatusEnum_PENDING;
    case 'ACTIVE':
      return _$createAdminUserDtoStatusEnum_ACTIVE;
    case 'BLOCKED':
      return _$createAdminUserDtoStatusEnum_BLOCKED;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<CreateAdminUserDtoStatusEnum>
    _$createAdminUserDtoStatusEnumValues =
    BuiltSet<CreateAdminUserDtoStatusEnum>(const <CreateAdminUserDtoStatusEnum>[
  _$createAdminUserDtoStatusEnum_PENDING,
  _$createAdminUserDtoStatusEnum_ACTIVE,
  _$createAdminUserDtoStatusEnum_BLOCKED,
]);

const CreateAdminUserDtoRoleEnum _$createAdminUserDtoRoleEnum_ADMIN =
    const CreateAdminUserDtoRoleEnum._('ADMIN');
const CreateAdminUserDtoRoleEnum _$createAdminUserDtoRoleEnum_USER =
    const CreateAdminUserDtoRoleEnum._('USER');

CreateAdminUserDtoRoleEnum _$createAdminUserDtoRoleEnumValueOf(String name) {
  switch (name) {
    case 'ADMIN':
      return _$createAdminUserDtoRoleEnum_ADMIN;
    case 'USER':
      return _$createAdminUserDtoRoleEnum_USER;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<CreateAdminUserDtoRoleEnum> _$createAdminUserDtoRoleEnumValues =
    BuiltSet<CreateAdminUserDtoRoleEnum>(const <CreateAdminUserDtoRoleEnum>[
  _$createAdminUserDtoRoleEnum_ADMIN,
  _$createAdminUserDtoRoleEnum_USER,
]);

Serializer<CreateAdminUserDtoStatusEnum>
    _$createAdminUserDtoStatusEnumSerializer =
    _$CreateAdminUserDtoStatusEnumSerializer();
Serializer<CreateAdminUserDtoRoleEnum> _$createAdminUserDtoRoleEnumSerializer =
    _$CreateAdminUserDtoRoleEnumSerializer();

class _$CreateAdminUserDtoStatusEnumSerializer
    implements PrimitiveSerializer<CreateAdminUserDtoStatusEnum> {
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
  final Iterable<Type> types = const <Type>[CreateAdminUserDtoStatusEnum];
  @override
  final String wireName = 'CreateAdminUserDtoStatusEnum';

  @override
  Object serialize(
    Serializers serializers,
    CreateAdminUserDtoStatusEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  CreateAdminUserDtoStatusEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      CreateAdminUserDtoStatusEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$CreateAdminUserDtoRoleEnumSerializer
    implements PrimitiveSerializer<CreateAdminUserDtoRoleEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'ADMIN': 'ADMIN',
    'USER': 'USER',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'ADMIN': 'ADMIN',
    'USER': 'USER',
  };

  @override
  final Iterable<Type> types = const <Type>[CreateAdminUserDtoRoleEnum];
  @override
  final String wireName = 'CreateAdminUserDtoRoleEnum';

  @override
  Object serialize(
    Serializers serializers,
    CreateAdminUserDtoRoleEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  CreateAdminUserDtoRoleEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      CreateAdminUserDtoRoleEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$CreateAdminUserDto extends CreateAdminUserDto {
  @override
  final String email;
  @override
  final String password;
  @override
  final String displayName;
  @override
  final JsonObject? avatarUrl;
  @override
  final CreateAdminUserDtoStatusEnum? status;
  @override
  final CreateAdminUserDtoRoleEnum? role;
  @override
  final String? organizationId;

  factory _$CreateAdminUserDto([
    void Function(CreateAdminUserDtoBuilder)? updates,
  ]) =>
      (CreateAdminUserDtoBuilder()..update(updates))._build();

  _$CreateAdminUserDto._({
    required this.email,
    required this.password,
    required this.displayName,
    this.avatarUrl,
    this.status,
    this.role,
    this.organizationId,
  }) : super._();
  @override
  CreateAdminUserDto rebuild(
    void Function(CreateAdminUserDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateAdminUserDtoBuilder toBuilder() =>
      CreateAdminUserDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateAdminUserDto &&
        email == other.email &&
        password == other.password &&
        displayName == other.displayName &&
        avatarUrl == other.avatarUrl &&
        status == other.status &&
        role == other.role &&
        organizationId == other.organizationId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, email.hashCode);
    _$hash = $jc(_$hash, password.hashCode);
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, avatarUrl.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, role.hashCode);
    _$hash = $jc(_$hash, organizationId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateAdminUserDto')
          ..add('email', email)
          ..add('password', password)
          ..add('displayName', displayName)
          ..add('avatarUrl', avatarUrl)
          ..add('status', status)
          ..add('role', role)
          ..add('organizationId', organizationId))
        .toString();
  }
}

class CreateAdminUserDtoBuilder
    implements Builder<CreateAdminUserDto, CreateAdminUserDtoBuilder> {
  _$CreateAdminUserDto? _$v;

  String? _email;
  String? get email => _$this._email;
  set email(String? email) => _$this._email = email;

  String? _password;
  String? get password => _$this._password;
  set password(String? password) => _$this._password = password;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  JsonObject? _avatarUrl;
  JsonObject? get avatarUrl => _$this._avatarUrl;
  set avatarUrl(JsonObject? avatarUrl) => _$this._avatarUrl = avatarUrl;

  CreateAdminUserDtoStatusEnum? _status;
  CreateAdminUserDtoStatusEnum? get status => _$this._status;
  set status(CreateAdminUserDtoStatusEnum? status) => _$this._status = status;

  CreateAdminUserDtoRoleEnum? _role;
  CreateAdminUserDtoRoleEnum? get role => _$this._role;
  set role(CreateAdminUserDtoRoleEnum? role) => _$this._role = role;

  String? _organizationId;
  String? get organizationId => _$this._organizationId;
  set organizationId(String? organizationId) =>
      _$this._organizationId = organizationId;

  CreateAdminUserDtoBuilder() {
    CreateAdminUserDto._defaults(this);
  }

  CreateAdminUserDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _email = $v.email;
      _password = $v.password;
      _displayName = $v.displayName;
      _avatarUrl = $v.avatarUrl;
      _status = $v.status;
      _role = $v.role;
      _organizationId = $v.organizationId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateAdminUserDto other) {
    _$v = other as _$CreateAdminUserDto;
  }

  @override
  void update(void Function(CreateAdminUserDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateAdminUserDto build() => _build();

  _$CreateAdminUserDto _build() {
    final _$result = _$v ??
        _$CreateAdminUserDto._(
          email: BuiltValueNullFieldError.checkNotNull(
            email,
            r'CreateAdminUserDto',
            'email',
          ),
          password: BuiltValueNullFieldError.checkNotNull(
            password,
            r'CreateAdminUserDto',
            'password',
          ),
          displayName: BuiltValueNullFieldError.checkNotNull(
            displayName,
            r'CreateAdminUserDto',
            'displayName',
          ),
          avatarUrl: avatarUrl,
          status: status,
          role: role,
          organizationId: organizationId,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
