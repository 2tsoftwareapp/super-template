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
    String name) {
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
  Object serialize(Serializers serializers, CreateAdminUserDtoStatusEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  CreateAdminUserDtoStatusEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      CreateAdminUserDtoStatusEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
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
  final BuiltList<String>? roleIds;

  factory _$CreateAdminUserDto(
          [void Function(CreateAdminUserDtoBuilder)? updates]) =>
      (CreateAdminUserDtoBuilder()..update(updates))._build();

  _$CreateAdminUserDto._(
      {required this.email,
      required this.password,
      required this.displayName,
      this.avatarUrl,
      this.status,
      this.roleIds})
      : super._();
  @override
  CreateAdminUserDto rebuild(
          void Function(CreateAdminUserDtoBuilder) updates) =>
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
        roleIds == other.roleIds;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, email.hashCode);
    _$hash = $jc(_$hash, password.hashCode);
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, avatarUrl.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, roleIds.hashCode);
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
          ..add('roleIds', roleIds))
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

  ListBuilder<String>? _roleIds;
  ListBuilder<String> get roleIds => _$this._roleIds ??= ListBuilder<String>();
  set roleIds(ListBuilder<String>? roleIds) => _$this._roleIds = roleIds;

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
      _roleIds = $v.roleIds?.toBuilder();
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
    _$CreateAdminUserDto _$result;
    try {
      _$result = _$v ??
          _$CreateAdminUserDto._(
            email: BuiltValueNullFieldError.checkNotNull(
                email, r'CreateAdminUserDto', 'email'),
            password: BuiltValueNullFieldError.checkNotNull(
                password, r'CreateAdminUserDto', 'password'),
            displayName: BuiltValueNullFieldError.checkNotNull(
                displayName, r'CreateAdminUserDto', 'displayName'),
            avatarUrl: avatarUrl,
            status: status,
            roleIds: _roleIds?.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'roleIds';
        _roleIds?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'CreateAdminUserDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
