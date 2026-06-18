// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'invitation_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const InvitationDtoStatusEnum _$invitationDtoStatusEnum_PENDING =
    const InvitationDtoStatusEnum._('PENDING');
const InvitationDtoStatusEnum _$invitationDtoStatusEnum_ACCEPTED =
    const InvitationDtoStatusEnum._('ACCEPTED');
const InvitationDtoStatusEnum _$invitationDtoStatusEnum_EXPIRED =
    const InvitationDtoStatusEnum._('EXPIRED');
const InvitationDtoStatusEnum _$invitationDtoStatusEnum_REVOKED =
    const InvitationDtoStatusEnum._('REVOKED');

InvitationDtoStatusEnum _$invitationDtoStatusEnumValueOf(String name) {
  switch (name) {
    case 'PENDING':
      return _$invitationDtoStatusEnum_PENDING;
    case 'ACCEPTED':
      return _$invitationDtoStatusEnum_ACCEPTED;
    case 'EXPIRED':
      return _$invitationDtoStatusEnum_EXPIRED;
    case 'REVOKED':
      return _$invitationDtoStatusEnum_REVOKED;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<InvitationDtoStatusEnum> _$invitationDtoStatusEnumValues =
    BuiltSet<InvitationDtoStatusEnum>(const <InvitationDtoStatusEnum>[
  _$invitationDtoStatusEnum_PENDING,
  _$invitationDtoStatusEnum_ACCEPTED,
  _$invitationDtoStatusEnum_EXPIRED,
  _$invitationDtoStatusEnum_REVOKED,
]);

Serializer<InvitationDtoStatusEnum> _$invitationDtoStatusEnumSerializer =
    _$InvitationDtoStatusEnumSerializer();

class _$InvitationDtoStatusEnumSerializer
    implements PrimitiveSerializer<InvitationDtoStatusEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'PENDING': 'PENDING',
    'ACCEPTED': 'ACCEPTED',
    'EXPIRED': 'EXPIRED',
    'REVOKED': 'REVOKED',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'PENDING': 'PENDING',
    'ACCEPTED': 'ACCEPTED',
    'EXPIRED': 'EXPIRED',
    'REVOKED': 'REVOKED',
  };

  @override
  final Iterable<Type> types = const <Type>[InvitationDtoStatusEnum];
  @override
  final String wireName = 'InvitationDtoStatusEnum';

  @override
  Object serialize(
    Serializers serializers,
    InvitationDtoStatusEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  InvitationDtoStatusEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      InvitationDtoStatusEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$InvitationDto extends InvitationDto {
  @override
  final String id;
  @override
  final String email;
  @override
  final String entityType;
  @override
  final String entityId;
  @override
  final JsonObject? role;
  @override
  final String invitedById;
  @override
  final InvitationDtoStatusEnum status;
  @override
  final String expiresAt;
  @override
  final JsonObject? acceptedAt;
  @override
  final JsonObject? acceptedById;
  @override
  final String createdAt;
  @override
  final String updatedAt;

  factory _$InvitationDto([void Function(InvitationDtoBuilder)? updates]) =>
      (InvitationDtoBuilder()..update(updates))._build();

  _$InvitationDto._({
    required this.id,
    required this.email,
    required this.entityType,
    required this.entityId,
    this.role,
    required this.invitedById,
    required this.status,
    required this.expiresAt,
    this.acceptedAt,
    this.acceptedById,
    required this.createdAt,
    required this.updatedAt,
  }) : super._();
  @override
  InvitationDto rebuild(void Function(InvitationDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  InvitationDtoBuilder toBuilder() => InvitationDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is InvitationDto &&
        id == other.id &&
        email == other.email &&
        entityType == other.entityType &&
        entityId == other.entityId &&
        role == other.role &&
        invitedById == other.invitedById &&
        status == other.status &&
        expiresAt == other.expiresAt &&
        acceptedAt == other.acceptedAt &&
        acceptedById == other.acceptedById &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, email.hashCode);
    _$hash = $jc(_$hash, entityType.hashCode);
    _$hash = $jc(_$hash, entityId.hashCode);
    _$hash = $jc(_$hash, role.hashCode);
    _$hash = $jc(_$hash, invitedById.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, expiresAt.hashCode);
    _$hash = $jc(_$hash, acceptedAt.hashCode);
    _$hash = $jc(_$hash, acceptedById.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'InvitationDto')
          ..add('id', id)
          ..add('email', email)
          ..add('entityType', entityType)
          ..add('entityId', entityId)
          ..add('role', role)
          ..add('invitedById', invitedById)
          ..add('status', status)
          ..add('expiresAt', expiresAt)
          ..add('acceptedAt', acceptedAt)
          ..add('acceptedById', acceptedById)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class InvitationDtoBuilder
    implements Builder<InvitationDto, InvitationDtoBuilder> {
  _$InvitationDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _email;
  String? get email => _$this._email;
  set email(String? email) => _$this._email = email;

  String? _entityType;
  String? get entityType => _$this._entityType;
  set entityType(String? entityType) => _$this._entityType = entityType;

  String? _entityId;
  String? get entityId => _$this._entityId;
  set entityId(String? entityId) => _$this._entityId = entityId;

  JsonObject? _role;
  JsonObject? get role => _$this._role;
  set role(JsonObject? role) => _$this._role = role;

  String? _invitedById;
  String? get invitedById => _$this._invitedById;
  set invitedById(String? invitedById) => _$this._invitedById = invitedById;

  InvitationDtoStatusEnum? _status;
  InvitationDtoStatusEnum? get status => _$this._status;
  set status(InvitationDtoStatusEnum? status) => _$this._status = status;

  String? _expiresAt;
  String? get expiresAt => _$this._expiresAt;
  set expiresAt(String? expiresAt) => _$this._expiresAt = expiresAt;

  JsonObject? _acceptedAt;
  JsonObject? get acceptedAt => _$this._acceptedAt;
  set acceptedAt(JsonObject? acceptedAt) => _$this._acceptedAt = acceptedAt;

  JsonObject? _acceptedById;
  JsonObject? get acceptedById => _$this._acceptedById;
  set acceptedById(JsonObject? acceptedById) =>
      _$this._acceptedById = acceptedById;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  InvitationDtoBuilder() {
    InvitationDto._defaults(this);
  }

  InvitationDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _email = $v.email;
      _entityType = $v.entityType;
      _entityId = $v.entityId;
      _role = $v.role;
      _invitedById = $v.invitedById;
      _status = $v.status;
      _expiresAt = $v.expiresAt;
      _acceptedAt = $v.acceptedAt;
      _acceptedById = $v.acceptedById;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(InvitationDto other) {
    _$v = other as _$InvitationDto;
  }

  @override
  void update(void Function(InvitationDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  InvitationDto build() => _build();

  _$InvitationDto _build() {
    final _$result = _$v ??
        _$InvitationDto._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'InvitationDto', 'id'),
          email: BuiltValueNullFieldError.checkNotNull(
            email,
            r'InvitationDto',
            'email',
          ),
          entityType: BuiltValueNullFieldError.checkNotNull(
            entityType,
            r'InvitationDto',
            'entityType',
          ),
          entityId: BuiltValueNullFieldError.checkNotNull(
            entityId,
            r'InvitationDto',
            'entityId',
          ),
          role: role,
          invitedById: BuiltValueNullFieldError.checkNotNull(
            invitedById,
            r'InvitationDto',
            'invitedById',
          ),
          status: BuiltValueNullFieldError.checkNotNull(
            status,
            r'InvitationDto',
            'status',
          ),
          expiresAt: BuiltValueNullFieldError.checkNotNull(
            expiresAt,
            r'InvitationDto',
            'expiresAt',
          ),
          acceptedAt: acceptedAt,
          acceptedById: acceptedById,
          createdAt: BuiltValueNullFieldError.checkNotNull(
            createdAt,
            r'InvitationDto',
            'createdAt',
          ),
          updatedAt: BuiltValueNullFieldError.checkNotNull(
            updatedAt,
            r'InvitationDto',
            'updatedAt',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
