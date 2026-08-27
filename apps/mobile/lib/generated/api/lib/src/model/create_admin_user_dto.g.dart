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

Serializer<CreateAdminUserDtoStatusEnum>
    _$createAdminUserDtoStatusEnumSerializer =
    _$CreateAdminUserDtoStatusEnumSerializer();

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

class _$CreateAdminUserDto extends CreateAdminUserDto {
  @override
  final JsonObject? avatarUrl;
  @override
  final String displayName;
  @override
  final String email;
  @override
  final String? organizationId;
  @override
  final String password;
  @override
  final String? roleId;
  @override
  final CreateAdminUserDtoStatusEnum? status;

  factory _$CreateAdminUserDto([
    void Function(CreateAdminUserDtoBuilder)? updates,
  ]) =>
      (CreateAdminUserDtoBuilder()..update(updates))._build();

  _$CreateAdminUserDto._({
    this.avatarUrl,
    required this.displayName,
    required this.email,
    this.organizationId,
    required this.password,
    this.roleId,
    this.status,
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
        avatarUrl == other.avatarUrl &&
        displayName == other.displayName &&
        email == other.email &&
        organizationId == other.organizationId &&
        password == other.password &&
        roleId == other.roleId &&
        status == other.status;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, avatarUrl.hashCode);
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, email.hashCode);
    _$hash = $jc(_$hash, organizationId.hashCode);
    _$hash = $jc(_$hash, password.hashCode);
    _$hash = $jc(_$hash, roleId.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateAdminUserDto')
          ..add('avatarUrl', avatarUrl)
          ..add('displayName', displayName)
          ..add('email', email)
          ..add('organizationId', organizationId)
          ..add('password', password)
          ..add('roleId', roleId)
          ..add('status', status))
        .toString();
  }
}

class CreateAdminUserDtoBuilder
    implements Builder<CreateAdminUserDto, CreateAdminUserDtoBuilder> {
  _$CreateAdminUserDto? _$v;

  JsonObject? _avatarUrl;
  JsonObject? get avatarUrl => _$this._avatarUrl;
  set avatarUrl(JsonObject? avatarUrl) => _$this._avatarUrl = avatarUrl;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  String? _email;
  String? get email => _$this._email;
  set email(String? email) => _$this._email = email;

  String? _organizationId;
  String? get organizationId => _$this._organizationId;
  set organizationId(String? organizationId) =>
      _$this._organizationId = organizationId;

  String? _password;
  String? get password => _$this._password;
  set password(String? password) => _$this._password = password;

  String? _roleId;
  String? get roleId => _$this._roleId;
  set roleId(String? roleId) => _$this._roleId = roleId;

  CreateAdminUserDtoStatusEnum? _status;
  CreateAdminUserDtoStatusEnum? get status => _$this._status;
  set status(CreateAdminUserDtoStatusEnum? status) => _$this._status = status;

  CreateAdminUserDtoBuilder() {
    CreateAdminUserDto._defaults(this);
  }

  CreateAdminUserDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _avatarUrl = $v.avatarUrl;
      _displayName = $v.displayName;
      _email = $v.email;
      _organizationId = $v.organizationId;
      _password = $v.password;
      _roleId = $v.roleId;
      _status = $v.status;
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
          avatarUrl: avatarUrl,
          displayName: BuiltValueNullFieldError.checkNotNull(
            displayName,
            r'CreateAdminUserDto',
            'displayName',
          ),
          email: BuiltValueNullFieldError.checkNotNull(
            email,
            r'CreateAdminUserDto',
            'email',
          ),
          organizationId: organizationId,
          password: BuiltValueNullFieldError.checkNotNull(
            password,
            r'CreateAdminUserDto',
            'password',
          ),
          roleId: roleId,
          status: status,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
