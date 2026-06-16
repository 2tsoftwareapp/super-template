// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'update_project_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const UpdateProjectDtoStatusEnum _$updateProjectDtoStatusEnum_DRAFT =
    const UpdateProjectDtoStatusEnum._('DRAFT');
const UpdateProjectDtoStatusEnum _$updateProjectDtoStatusEnum_ACTIVE =
    const UpdateProjectDtoStatusEnum._('ACTIVE');
const UpdateProjectDtoStatusEnum _$updateProjectDtoStatusEnum_ARCHIVED =
    const UpdateProjectDtoStatusEnum._('ARCHIVED');

UpdateProjectDtoStatusEnum _$updateProjectDtoStatusEnumValueOf(String name) {
  switch (name) {
    case 'DRAFT':
      return _$updateProjectDtoStatusEnum_DRAFT;
    case 'ACTIVE':
      return _$updateProjectDtoStatusEnum_ACTIVE;
    case 'ARCHIVED':
      return _$updateProjectDtoStatusEnum_ARCHIVED;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<UpdateProjectDtoStatusEnum> _$updateProjectDtoStatusEnumValues =
    BuiltSet<UpdateProjectDtoStatusEnum>(const <UpdateProjectDtoStatusEnum>[
  _$updateProjectDtoStatusEnum_DRAFT,
  _$updateProjectDtoStatusEnum_ACTIVE,
  _$updateProjectDtoStatusEnum_ARCHIVED,
]);

Serializer<UpdateProjectDtoStatusEnum> _$updateProjectDtoStatusEnumSerializer =
    _$UpdateProjectDtoStatusEnumSerializer();

class _$UpdateProjectDtoStatusEnumSerializer
    implements PrimitiveSerializer<UpdateProjectDtoStatusEnum> {
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
  final Iterable<Type> types = const <Type>[UpdateProjectDtoStatusEnum];
  @override
  final String wireName = 'UpdateProjectDtoStatusEnum';

  @override
  Object serialize(Serializers serializers, UpdateProjectDtoStatusEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  UpdateProjectDtoStatusEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      UpdateProjectDtoStatusEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$UpdateProjectDto extends UpdateProjectDto {
  @override
  final String? name;
  @override
  final String? description;
  @override
  final UpdateProjectDtoStatusEnum? status;
  @override
  final String? ownerId;

  factory _$UpdateProjectDto(
          [void Function(UpdateProjectDtoBuilder)? updates]) =>
      (UpdateProjectDtoBuilder()..update(updates))._build();

  _$UpdateProjectDto._({this.name, this.description, this.status, this.ownerId})
      : super._();
  @override
  UpdateProjectDto rebuild(void Function(UpdateProjectDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateProjectDtoBuilder toBuilder() =>
      UpdateProjectDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateProjectDto &&
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
    return (newBuiltValueToStringHelper(r'UpdateProjectDto')
          ..add('name', name)
          ..add('description', description)
          ..add('status', status)
          ..add('ownerId', ownerId))
        .toString();
  }
}

class UpdateProjectDtoBuilder
    implements Builder<UpdateProjectDto, UpdateProjectDtoBuilder> {
  _$UpdateProjectDto? _$v;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _description;
  String? get description => _$this._description;
  set description(String? description) => _$this._description = description;

  UpdateProjectDtoStatusEnum? _status;
  UpdateProjectDtoStatusEnum? get status => _$this._status;
  set status(UpdateProjectDtoStatusEnum? status) => _$this._status = status;

  String? _ownerId;
  String? get ownerId => _$this._ownerId;
  set ownerId(String? ownerId) => _$this._ownerId = ownerId;

  UpdateProjectDtoBuilder() {
    UpdateProjectDto._defaults(this);
  }

  UpdateProjectDtoBuilder get _$this {
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
  void replace(UpdateProjectDto other) {
    _$v = other as _$UpdateProjectDto;
  }

  @override
  void update(void Function(UpdateProjectDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateProjectDto build() => _build();

  _$UpdateProjectDto _build() {
    final _$result = _$v ??
        _$UpdateProjectDto._(
          name: name,
          description: description,
          status: status,
          ownerId: ownerId,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
