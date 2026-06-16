// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'create_project_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const CreateProjectDtoStatusEnum _$createProjectDtoStatusEnum_DRAFT =
    const CreateProjectDtoStatusEnum._('DRAFT');
const CreateProjectDtoStatusEnum _$createProjectDtoStatusEnum_ACTIVE =
    const CreateProjectDtoStatusEnum._('ACTIVE');
const CreateProjectDtoStatusEnum _$createProjectDtoStatusEnum_ARCHIVED =
    const CreateProjectDtoStatusEnum._('ARCHIVED');

CreateProjectDtoStatusEnum _$createProjectDtoStatusEnumValueOf(String name) {
  switch (name) {
    case 'DRAFT':
      return _$createProjectDtoStatusEnum_DRAFT;
    case 'ACTIVE':
      return _$createProjectDtoStatusEnum_ACTIVE;
    case 'ARCHIVED':
      return _$createProjectDtoStatusEnum_ARCHIVED;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<CreateProjectDtoStatusEnum> _$createProjectDtoStatusEnumValues =
    BuiltSet<CreateProjectDtoStatusEnum>(const <CreateProjectDtoStatusEnum>[
  _$createProjectDtoStatusEnum_DRAFT,
  _$createProjectDtoStatusEnum_ACTIVE,
  _$createProjectDtoStatusEnum_ARCHIVED,
]);

Serializer<CreateProjectDtoStatusEnum> _$createProjectDtoStatusEnumSerializer =
    _$CreateProjectDtoStatusEnumSerializer();

class _$CreateProjectDtoStatusEnumSerializer
    implements PrimitiveSerializer<CreateProjectDtoStatusEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'DRAFT': 'DRAFT',
    'ACTIVE': 'ACTIVE',
    'ARCHIVED': 'ARCHIVED',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'DRAFT': 'DRAFT',
    'ACTIVE': 'ACTIVE',
    'ARCHIVED': 'ARCHIVED',
  };

  @override
  final Iterable<Type> types = const <Type>[CreateProjectDtoStatusEnum];
  @override
  final String wireName = 'CreateProjectDtoStatusEnum';

  @override
  Object serialize(Serializers serializers, CreateProjectDtoStatusEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  CreateProjectDtoStatusEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      CreateProjectDtoStatusEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$CreateProjectDto extends CreateProjectDto {
  @override
  final String name;
  @override
  final String? description;
  @override
  final CreateProjectDtoStatusEnum? status;
  @override
  final String? ownerId;

  factory _$CreateProjectDto(
          [void Function(CreateProjectDtoBuilder)? updates]) =>
      (CreateProjectDtoBuilder()..update(updates))._build();

  _$CreateProjectDto._(
      {required this.name, this.description, this.status, this.ownerId})
      : super._();
  @override
  CreateProjectDto rebuild(void Function(CreateProjectDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateProjectDtoBuilder toBuilder() =>
      CreateProjectDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateProjectDto &&
        name == other.name &&
        description == other.description &&
        status == other.status &&
        ownerId == other.ownerId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, ownerId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateProjectDto')
          ..add('name', name)
          ..add('description', description)
          ..add('status', status)
          ..add('ownerId', ownerId))
        .toString();
  }
}

class CreateProjectDtoBuilder
    implements Builder<CreateProjectDto, CreateProjectDtoBuilder> {
  _$CreateProjectDto? _$v;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _description;
  String? get description => _$this._description;
  set description(String? description) => _$this._description = description;

  CreateProjectDtoStatusEnum? _status;
  CreateProjectDtoStatusEnum? get status => _$this._status;
  set status(CreateProjectDtoStatusEnum? status) => _$this._status = status;

  String? _ownerId;
  String? get ownerId => _$this._ownerId;
  set ownerId(String? ownerId) => _$this._ownerId = ownerId;

  CreateProjectDtoBuilder() {
    CreateProjectDto._defaults(this);
  }

  CreateProjectDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _name = $v.name;
      _description = $v.description;
      _status = $v.status;
      _ownerId = $v.ownerId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateProjectDto other) {
    _$v = other as _$CreateProjectDto;
  }

  @override
  void update(void Function(CreateProjectDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateProjectDto build() => _build();

  _$CreateProjectDto _build() {
    final _$result = _$v ??
        _$CreateProjectDto._(
          name: BuiltValueNullFieldError.checkNotNull(
              name, r'CreateProjectDto', 'name'),
          description: description,
          status: status,
          ownerId: ownerId,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
