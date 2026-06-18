// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'update_admin_user_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const UpdateAdminUserDtoStatusEnum _$updateAdminUserDtoStatusEnum_PENDING =
    const UpdateAdminUserDtoStatusEnum._('PENDING');
const UpdateAdminUserDtoStatusEnum _$updateAdminUserDtoStatusEnum_ACTIVE =
    const UpdateAdminUserDtoStatusEnum._('ACTIVE');
const UpdateAdminUserDtoStatusEnum _$updateAdminUserDtoStatusEnum_BLOCKED =
    const UpdateAdminUserDtoStatusEnum._('BLOCKED');

UpdateAdminUserDtoStatusEnum _$updateAdminUserDtoStatusEnumValueOf(
  String name,
) {
  switch (name) {
    case 'PENDING':
      return _$updateAdminUserDtoStatusEnum_PENDING;
    case 'ACTIVE':
      return _$updateAdminUserDtoStatusEnum_ACTIVE;
    case 'BLOCKED':
      return _$updateAdminUserDtoStatusEnum_BLOCKED;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<UpdateAdminUserDtoStatusEnum>
    _$updateAdminUserDtoStatusEnumValues =
    BuiltSet<UpdateAdminUserDtoStatusEnum>(const <UpdateAdminUserDtoStatusEnum>[
  _$updateAdminUserDtoStatusEnum_PENDING,
  _$updateAdminUserDtoStatusEnum_ACTIVE,
  _$updateAdminUserDtoStatusEnum_BLOCKED,
]);

Serializer<UpdateAdminUserDtoStatusEnum>
    _$updateAdminUserDtoStatusEnumSerializer =
    _$UpdateAdminUserDtoStatusEnumSerializer();

class _$UpdateAdminUserDtoStatusEnumSerializer
    implements PrimitiveSerializer<UpdateAdminUserDtoStatusEnum> {
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
  final Iterable<Type> types = const <Type>[UpdateAdminUserDtoStatusEnum];
  @override
  final String wireName = 'UpdateAdminUserDtoStatusEnum';

  @override
  Object serialize(
    Serializers serializers,
    UpdateAdminUserDtoStatusEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  UpdateAdminUserDtoStatusEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      UpdateAdminUserDtoStatusEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$UpdateAdminUserDto extends UpdateAdminUserDto {
  @override
  final String? email;
  @override
  final String? password;
  @override
  final String? displayName;
  @override
  final JsonObject? avatarUrl;
  @override
  final UpdateAdminUserDtoStatusEnum? status;

  factory _$UpdateAdminUserDto([
    void Function(UpdateAdminUserDtoBuilder)? updates,
  ]) =>
      (UpdateAdminUserDtoBuilder()..update(updates))._build();

  _$UpdateAdminUserDto._({
    this.email,
    this.password,
    this.displayName,
    this.avatarUrl,
    this.status,
  }) : super._();
  @override
  UpdateAdminUserDto rebuild(
    void Function(UpdateAdminUserDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateAdminUserDtoBuilder toBuilder() =>
      UpdateAdminUserDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateAdminUserDto &&
        email == other.email &&
        password == other.password &&
        displayName == other.displayName &&
        avatarUrl == other.avatarUrl &&
        status == other.status;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, email.hashCode);
    _$hash = $jc(_$hash, password.hashCode);
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, avatarUrl.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdateAdminUserDto')
          ..add('email', email)
          ..add('password', password)
          ..add('displayName', displayName)
          ..add('avatarUrl', avatarUrl)
          ..add('status', status))
        .toString();
  }
}

class UpdateAdminUserDtoBuilder
    implements Builder<UpdateAdminUserDto, UpdateAdminUserDtoBuilder> {
  _$UpdateAdminUserDto? _$v;

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

  UpdateAdminUserDtoStatusEnum? _status;
  UpdateAdminUserDtoStatusEnum? get status => _$this._status;
  set status(UpdateAdminUserDtoStatusEnum? status) => _$this._status = status;

  UpdateAdminUserDtoBuilder() {
    UpdateAdminUserDto._defaults(this);
  }

  UpdateAdminUserDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _email = $v.email;
      _password = $v.password;
      _displayName = $v.displayName;
      _avatarUrl = $v.avatarUrl;
      _status = $v.status;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateAdminUserDto other) {
    _$v = other as _$UpdateAdminUserDto;
  }

  @override
  void update(void Function(UpdateAdminUserDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateAdminUserDto build() => _build();

  _$UpdateAdminUserDto _build() {
    final _$result = _$v ??
        _$UpdateAdminUserDto._(
          email: email,
          password: password,
          displayName: displayName,
          avatarUrl: avatarUrl,
          status: status,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
