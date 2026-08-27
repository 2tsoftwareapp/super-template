// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'auth_user_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const AuthUserDtoStatusEnum _$authUserDtoStatusEnum_PENDING =
    const AuthUserDtoStatusEnum._('PENDING');
const AuthUserDtoStatusEnum _$authUserDtoStatusEnum_ACTIVE =
    const AuthUserDtoStatusEnum._('ACTIVE');
const AuthUserDtoStatusEnum _$authUserDtoStatusEnum_BLOCKED =
    const AuthUserDtoStatusEnum._('BLOCKED');

AuthUserDtoStatusEnum _$authUserDtoStatusEnumValueOf(String name) {
  switch (name) {
    case 'PENDING':
      return _$authUserDtoStatusEnum_PENDING;
    case 'ACTIVE':
      return _$authUserDtoStatusEnum_ACTIVE;
    case 'BLOCKED':
      return _$authUserDtoStatusEnum_BLOCKED;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<AuthUserDtoStatusEnum> _$authUserDtoStatusEnumValues =
    BuiltSet<AuthUserDtoStatusEnum>(const <AuthUserDtoStatusEnum>[
  _$authUserDtoStatusEnum_PENDING,
  _$authUserDtoStatusEnum_ACTIVE,
  _$authUserDtoStatusEnum_BLOCKED,
]);

Serializer<AuthUserDtoStatusEnum> _$authUserDtoStatusEnumSerializer =
    _$AuthUserDtoStatusEnumSerializer();

class _$AuthUserDtoStatusEnumSerializer
    implements PrimitiveSerializer<AuthUserDtoStatusEnum> {
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
  final Iterable<Type> types = const <Type>[AuthUserDtoStatusEnum];
  @override
  final String wireName = 'AuthUserDtoStatusEnum';

  @override
  Object serialize(
    Serializers serializers,
    AuthUserDtoStatusEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  AuthUserDtoStatusEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      AuthUserDtoStatusEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$AuthUserDto extends AuthUserDto {
  @override
  final JsonObject? avatarUrl;
  @override
  final String createdAt;
  @override
  final String displayName;
  @override
  final String email;
  @override
  final String? emailVerifiedAt;
  @override
  final String id;
  @override
  final BuiltList<String> roles;
  @override
  final AuthUserDtoStatusEnum status;
  @override
  final String updatedAt;

  factory _$AuthUserDto([void Function(AuthUserDtoBuilder)? updates]) =>
      (AuthUserDtoBuilder()..update(updates))._build();

  _$AuthUserDto._({
    this.avatarUrl,
    required this.createdAt,
    required this.displayName,
    required this.email,
    this.emailVerifiedAt,
    required this.id,
    required this.roles,
    required this.status,
    required this.updatedAt,
  }) : super._();
  @override
  AuthUserDto rebuild(void Function(AuthUserDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AuthUserDtoBuilder toBuilder() => AuthUserDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuthUserDto &&
        avatarUrl == other.avatarUrl &&
        createdAt == other.createdAt &&
        displayName == other.displayName &&
        email == other.email &&
        emailVerifiedAt == other.emailVerifiedAt &&
        id == other.id &&
        roles == other.roles &&
        status == other.status &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, avatarUrl.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, email.hashCode);
    _$hash = $jc(_$hash, emailVerifiedAt.hashCode);
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, roles.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AuthUserDto')
          ..add('avatarUrl', avatarUrl)
          ..add('createdAt', createdAt)
          ..add('displayName', displayName)
          ..add('email', email)
          ..add('emailVerifiedAt', emailVerifiedAt)
          ..add('id', id)
          ..add('roles', roles)
          ..add('status', status)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class AuthUserDtoBuilder implements Builder<AuthUserDto, AuthUserDtoBuilder> {
  _$AuthUserDto? _$v;

  JsonObject? _avatarUrl;
  JsonObject? get avatarUrl => _$this._avatarUrl;
  set avatarUrl(JsonObject? avatarUrl) => _$this._avatarUrl = avatarUrl;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  String? _email;
  String? get email => _$this._email;
  set email(String? email) => _$this._email = email;

  String? _emailVerifiedAt;
  String? get emailVerifiedAt => _$this._emailVerifiedAt;
  set emailVerifiedAt(String? emailVerifiedAt) =>
      _$this._emailVerifiedAt = emailVerifiedAt;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  ListBuilder<String>? _roles;
  ListBuilder<String> get roles => _$this._roles ??= ListBuilder<String>();
  set roles(ListBuilder<String>? roles) => _$this._roles = roles;

  AuthUserDtoStatusEnum? _status;
  AuthUserDtoStatusEnum? get status => _$this._status;
  set status(AuthUserDtoStatusEnum? status) => _$this._status = status;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  AuthUserDtoBuilder() {
    AuthUserDto._defaults(this);
  }

  AuthUserDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _avatarUrl = $v.avatarUrl;
      _createdAt = $v.createdAt;
      _displayName = $v.displayName;
      _email = $v.email;
      _emailVerifiedAt = $v.emailVerifiedAt;
      _id = $v.id;
      _roles = $v.roles.toBuilder();
      _status = $v.status;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuthUserDto other) {
    _$v = other as _$AuthUserDto;
  }

  @override
  void update(void Function(AuthUserDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AuthUserDto build() => _build();

  _$AuthUserDto _build() {
    _$AuthUserDto _$result;
    try {
      _$result = _$v ??
          _$AuthUserDto._(
            avatarUrl: avatarUrl,
            createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt,
              r'AuthUserDto',
              'createdAt',
            ),
            displayName: BuiltValueNullFieldError.checkNotNull(
              displayName,
              r'AuthUserDto',
              'displayName',
            ),
            email: BuiltValueNullFieldError.checkNotNull(
              email,
              r'AuthUserDto',
              'email',
            ),
            emailVerifiedAt: emailVerifiedAt,
            id: BuiltValueNullFieldError.checkNotNull(id, r'AuthUserDto', 'id'),
            roles: roles.build(),
            status: BuiltValueNullFieldError.checkNotNull(
              status,
              r'AuthUserDto',
              'status',
            ),
            updatedAt: BuiltValueNullFieldError.checkNotNull(
              updatedAt,
              r'AuthUserDto',
              'updatedAt',
            ),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'roles';
        roles.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'AuthUserDto',
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
