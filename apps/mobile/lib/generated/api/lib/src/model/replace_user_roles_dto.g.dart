// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'replace_user_roles_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const ReplaceUserRolesDtoRoleEnum _$replaceUserRolesDtoRoleEnum_ADMIN =
    const ReplaceUserRolesDtoRoleEnum._('ADMIN');
const ReplaceUserRolesDtoRoleEnum _$replaceUserRolesDtoRoleEnum_USER =
    const ReplaceUserRolesDtoRoleEnum._('USER');

ReplaceUserRolesDtoRoleEnum _$replaceUserRolesDtoRoleEnumValueOf(String name) {
  switch (name) {
    case 'ADMIN':
      return _$replaceUserRolesDtoRoleEnum_ADMIN;
    case 'USER':
      return _$replaceUserRolesDtoRoleEnum_USER;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<ReplaceUserRolesDtoRoleEnum>
    _$replaceUserRolesDtoRoleEnumValues = BuiltSet<ReplaceUserRolesDtoRoleEnum>(
  const <ReplaceUserRolesDtoRoleEnum>[
    _$replaceUserRolesDtoRoleEnum_ADMIN,
    _$replaceUserRolesDtoRoleEnum_USER,
  ],
);

Serializer<ReplaceUserRolesDtoRoleEnum>
    _$replaceUserRolesDtoRoleEnumSerializer =
    _$ReplaceUserRolesDtoRoleEnumSerializer();

class _$ReplaceUserRolesDtoRoleEnumSerializer
    implements PrimitiveSerializer<ReplaceUserRolesDtoRoleEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'ADMIN': 'ADMIN',
    'USER': 'USER',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'ADMIN': 'ADMIN',
    'USER': 'USER',
  };

  @override
  final Iterable<Type> types = const <Type>[ReplaceUserRolesDtoRoleEnum];
  @override
  final String wireName = 'ReplaceUserRolesDtoRoleEnum';

  @override
  Object serialize(
    Serializers serializers,
    ReplaceUserRolesDtoRoleEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  ReplaceUserRolesDtoRoleEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      ReplaceUserRolesDtoRoleEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$ReplaceUserRolesDto extends ReplaceUserRolesDto {
  @override
  final ReplaceUserRolesDtoRoleEnum role;
  @override
  final String? organizationId;

  factory _$ReplaceUserRolesDto([
    void Function(ReplaceUserRolesDtoBuilder)? updates,
  ]) =>
      (ReplaceUserRolesDtoBuilder()..update(updates))._build();

  _$ReplaceUserRolesDto._({required this.role, this.organizationId})
      : super._();
  @override
  ReplaceUserRolesDto rebuild(
    void Function(ReplaceUserRolesDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  ReplaceUserRolesDtoBuilder toBuilder() =>
      ReplaceUserRolesDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ReplaceUserRolesDto &&
        role == other.role &&
        organizationId == other.organizationId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, role.hashCode);
    _$hash = $jc(_$hash, organizationId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ReplaceUserRolesDto')
          ..add('role', role)
          ..add('organizationId', organizationId))
        .toString();
  }
}

class ReplaceUserRolesDtoBuilder
    implements Builder<ReplaceUserRolesDto, ReplaceUserRolesDtoBuilder> {
  _$ReplaceUserRolesDto? _$v;

  ReplaceUserRolesDtoRoleEnum? _role;
  ReplaceUserRolesDtoRoleEnum? get role => _$this._role;
  set role(ReplaceUserRolesDtoRoleEnum? role) => _$this._role = role;

  String? _organizationId;
  String? get organizationId => _$this._organizationId;
  set organizationId(String? organizationId) =>
      _$this._organizationId = organizationId;

  ReplaceUserRolesDtoBuilder() {
    ReplaceUserRolesDto._defaults(this);
  }

  ReplaceUserRolesDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _role = $v.role;
      _organizationId = $v.organizationId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ReplaceUserRolesDto other) {
    _$v = other as _$ReplaceUserRolesDto;
  }

  @override
  void update(void Function(ReplaceUserRolesDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ReplaceUserRolesDto build() => _build();

  _$ReplaceUserRolesDto _build() {
    final _$result = _$v ??
        _$ReplaceUserRolesDto._(
          role: BuiltValueNullFieldError.checkNotNull(
            role,
            r'ReplaceUserRolesDto',
            'role',
          ),
          organizationId: organizationId,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
