// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'update_member_role_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const UpdateMemberRoleDtoRoleEnum _$updateMemberRoleDtoRoleEnum_OWNER =
    const UpdateMemberRoleDtoRoleEnum._('OWNER');
const UpdateMemberRoleDtoRoleEnum _$updateMemberRoleDtoRoleEnum_ADMIN =
    const UpdateMemberRoleDtoRoleEnum._('ADMIN');
const UpdateMemberRoleDtoRoleEnum _$updateMemberRoleDtoRoleEnum_MEMBER =
    const UpdateMemberRoleDtoRoleEnum._('MEMBER');

UpdateMemberRoleDtoRoleEnum _$updateMemberRoleDtoRoleEnumValueOf(String name) {
  switch (name) {
    case 'OWNER':
      return _$updateMemberRoleDtoRoleEnum_OWNER;
    case 'ADMIN':
      return _$updateMemberRoleDtoRoleEnum_ADMIN;
    case 'MEMBER':
      return _$updateMemberRoleDtoRoleEnum_MEMBER;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<UpdateMemberRoleDtoRoleEnum>
    _$updateMemberRoleDtoRoleEnumValues =
    BuiltSet<UpdateMemberRoleDtoRoleEnum>(const <UpdateMemberRoleDtoRoleEnum>[
  _$updateMemberRoleDtoRoleEnum_OWNER,
  _$updateMemberRoleDtoRoleEnum_ADMIN,
  _$updateMemberRoleDtoRoleEnum_MEMBER,
]);

Serializer<UpdateMemberRoleDtoRoleEnum>
    _$updateMemberRoleDtoRoleEnumSerializer =
    _$UpdateMemberRoleDtoRoleEnumSerializer();

class _$UpdateMemberRoleDtoRoleEnumSerializer
    implements PrimitiveSerializer<UpdateMemberRoleDtoRoleEnum> {
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
  final Iterable<Type> types = const <Type>[UpdateMemberRoleDtoRoleEnum];
  @override
  final String wireName = 'UpdateMemberRoleDtoRoleEnum';

  @override
  Object serialize(
    Serializers serializers,
    UpdateMemberRoleDtoRoleEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  UpdateMemberRoleDtoRoleEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      UpdateMemberRoleDtoRoleEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$UpdateMemberRoleDto extends UpdateMemberRoleDto {
  @override
  final UpdateMemberRoleDtoRoleEnum role;

  factory _$UpdateMemberRoleDto([
    void Function(UpdateMemberRoleDtoBuilder)? updates,
  ]) =>
      (UpdateMemberRoleDtoBuilder()..update(updates))._build();

  _$UpdateMemberRoleDto._({required this.role}) : super._();
  @override
  UpdateMemberRoleDto rebuild(
    void Function(UpdateMemberRoleDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateMemberRoleDtoBuilder toBuilder() =>
      UpdateMemberRoleDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateMemberRoleDto && role == other.role;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, role.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'UpdateMemberRoleDto',
    )..add('role', role))
        .toString();
  }
}

class UpdateMemberRoleDtoBuilder
    implements Builder<UpdateMemberRoleDto, UpdateMemberRoleDtoBuilder> {
  _$UpdateMemberRoleDto? _$v;

  UpdateMemberRoleDtoRoleEnum? _role;
  UpdateMemberRoleDtoRoleEnum? get role => _$this._role;
  set role(UpdateMemberRoleDtoRoleEnum? role) => _$this._role = role;

  UpdateMemberRoleDtoBuilder() {
    UpdateMemberRoleDto._defaults(this);
  }

  UpdateMemberRoleDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _role = $v.role;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateMemberRoleDto other) {
    _$v = other as _$UpdateMemberRoleDto;
  }

  @override
  void update(void Function(UpdateMemberRoleDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateMemberRoleDto build() => _build();

  _$UpdateMemberRoleDto _build() {
    final _$result = _$v ??
        _$UpdateMemberRoleDto._(
          role: BuiltValueNullFieldError.checkNotNull(
            role,
            r'UpdateMemberRoleDto',
            'role',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
