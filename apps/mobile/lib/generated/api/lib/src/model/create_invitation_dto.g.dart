// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'create_invitation_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const CreateInvitationDtoEntityTypeEnum
    _$createInvitationDtoEntityTypeEnum_organization =
    const CreateInvitationDtoEntityTypeEnum._('organization');
const CreateInvitationDtoEntityTypeEnum
    _$createInvitationDtoEntityTypeEnum_project =
    const CreateInvitationDtoEntityTypeEnum._('project');

CreateInvitationDtoEntityTypeEnum _$createInvitationDtoEntityTypeEnumValueOf(
  String name,
) {
  switch (name) {
    case 'organization':
      return _$createInvitationDtoEntityTypeEnum_organization;
    case 'project':
      return _$createInvitationDtoEntityTypeEnum_project;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<CreateInvitationDtoEntityTypeEnum>
    _$createInvitationDtoEntityTypeEnumValues =
    BuiltSet<CreateInvitationDtoEntityTypeEnum>(
  const <CreateInvitationDtoEntityTypeEnum>[
    _$createInvitationDtoEntityTypeEnum_organization,
    _$createInvitationDtoEntityTypeEnum_project,
  ],
);

Serializer<CreateInvitationDtoEntityTypeEnum>
    _$createInvitationDtoEntityTypeEnumSerializer =
    _$CreateInvitationDtoEntityTypeEnumSerializer();

class _$CreateInvitationDtoEntityTypeEnumSerializer
    implements PrimitiveSerializer<CreateInvitationDtoEntityTypeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'organization': 'organization',
    'project': 'project',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'organization': 'organization',
    'project': 'project',
  };

  @override
  final Iterable<Type> types = const <Type>[CreateInvitationDtoEntityTypeEnum];
  @override
  final String wireName = 'CreateInvitationDtoEntityTypeEnum';

  @override
  Object serialize(
    Serializers serializers,
    CreateInvitationDtoEntityTypeEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  CreateInvitationDtoEntityTypeEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      CreateInvitationDtoEntityTypeEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$CreateInvitationDto extends CreateInvitationDto {
  @override
  final String email;
  @override
  final CreateInvitationDtoEntityTypeEnum entityType;
  @override
  final String entityId;
  @override
  final String? role;

  factory _$CreateInvitationDto([
    void Function(CreateInvitationDtoBuilder)? updates,
  ]) =>
      (CreateInvitationDtoBuilder()..update(updates))._build();

  _$CreateInvitationDto._({
    required this.email,
    required this.entityType,
    required this.entityId,
    this.role,
  }) : super._();
  @override
  CreateInvitationDto rebuild(
    void Function(CreateInvitationDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateInvitationDtoBuilder toBuilder() =>
      CreateInvitationDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateInvitationDto &&
        email == other.email &&
        entityType == other.entityType &&
        entityId == other.entityId &&
        role == other.role;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, email.hashCode);
    _$hash = $jc(_$hash, entityType.hashCode);
    _$hash = $jc(_$hash, entityId.hashCode);
    _$hash = $jc(_$hash, role.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateInvitationDto')
          ..add('email', email)
          ..add('entityType', entityType)
          ..add('entityId', entityId)
          ..add('role', role))
        .toString();
  }
}

class CreateInvitationDtoBuilder
    implements Builder<CreateInvitationDto, CreateInvitationDtoBuilder> {
  _$CreateInvitationDto? _$v;

  String? _email;
  String? get email => _$this._email;
  set email(String? email) => _$this._email = email;

  CreateInvitationDtoEntityTypeEnum? _entityType;
  CreateInvitationDtoEntityTypeEnum? get entityType => _$this._entityType;
  set entityType(CreateInvitationDtoEntityTypeEnum? entityType) =>
      _$this._entityType = entityType;

  String? _entityId;
  String? get entityId => _$this._entityId;
  set entityId(String? entityId) => _$this._entityId = entityId;

  String? _role;
  String? get role => _$this._role;
  set role(String? role) => _$this._role = role;

  CreateInvitationDtoBuilder() {
    CreateInvitationDto._defaults(this);
  }

  CreateInvitationDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _email = $v.email;
      _entityType = $v.entityType;
      _entityId = $v.entityId;
      _role = $v.role;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateInvitationDto other) {
    _$v = other as _$CreateInvitationDto;
  }

  @override
  void update(void Function(CreateInvitationDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateInvitationDto build() => _build();

  _$CreateInvitationDto _build() {
    final _$result = _$v ??
        _$CreateInvitationDto._(
          email: BuiltValueNullFieldError.checkNotNull(
            email,
            r'CreateInvitationDto',
            'email',
          ),
          entityType: BuiltValueNullFieldError.checkNotNull(
            entityType,
            r'CreateInvitationDto',
            'entityType',
          ),
          entityId: BuiltValueNullFieldError.checkNotNull(
            entityId,
            r'CreateInvitationDto',
            'entityId',
          ),
          role: role,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
