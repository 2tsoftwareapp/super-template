// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'project_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const ProjectDtoStatusEnum _$projectDtoStatusEnum_DRAFT =
    const ProjectDtoStatusEnum._('DRAFT');
const ProjectDtoStatusEnum _$projectDtoStatusEnum_ACTIVE =
    const ProjectDtoStatusEnum._('ACTIVE');
const ProjectDtoStatusEnum _$projectDtoStatusEnum_ARCHIVED =
    const ProjectDtoStatusEnum._('ARCHIVED');

ProjectDtoStatusEnum _$projectDtoStatusEnumValueOf(String name) {
  switch (name) {
    case 'DRAFT':
      return _$projectDtoStatusEnum_DRAFT;
    case 'ACTIVE':
      return _$projectDtoStatusEnum_ACTIVE;
    case 'ARCHIVED':
      return _$projectDtoStatusEnum_ARCHIVED;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<ProjectDtoStatusEnum> _$projectDtoStatusEnumValues =
    BuiltSet<ProjectDtoStatusEnum>(const <ProjectDtoStatusEnum>[
      _$projectDtoStatusEnum_DRAFT,
      _$projectDtoStatusEnum_ACTIVE,
      _$projectDtoStatusEnum_ARCHIVED,
    ]);

Serializer<ProjectDtoStatusEnum> _$projectDtoStatusEnumSerializer =
    _$ProjectDtoStatusEnumSerializer();

class _$ProjectDtoStatusEnumSerializer
    implements PrimitiveSerializer<ProjectDtoStatusEnum> {
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
  final Iterable<Type> types = const <Type>[ProjectDtoStatusEnum];
  @override
  final String wireName = 'ProjectDtoStatusEnum';

  @override
  Object serialize(
    Serializers serializers,
    ProjectDtoStatusEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) => _toWire[object.name] ?? object.name;

  @override
  ProjectDtoStatusEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) => ProjectDtoStatusEnum.valueOf(
    _fromWire[serialized] ?? (serialized is String ? serialized : ''),
  );
}

class _$ProjectDto extends ProjectDto {
  @override
  final String id;
  @override
  final String name;
  @override
  final JsonObject? description;
  @override
  final ProjectDtoStatusEnum status;
  @override
  final String ownerId;
  @override
  final String createdById;
  @override
  final JsonObject? updatedById;
  @override
  final String createdAt;
  @override
  final String updatedAt;
  @override
  final JsonObject? deletedAt;

  factory _$ProjectDto([void Function(ProjectDtoBuilder)? updates]) =>
      (ProjectDtoBuilder()..update(updates))._build();

  _$ProjectDto._({
    required this.id,
    required this.name,
    this.description,
    required this.status,
    required this.ownerId,
    required this.createdById,
    this.updatedById,
    required this.createdAt,
    required this.updatedAt,
    this.deletedAt,
  }) : super._();
  @override
  ProjectDto rebuild(void Function(ProjectDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ProjectDtoBuilder toBuilder() => ProjectDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ProjectDto &&
        id == other.id &&
        name == other.name &&
        description == other.description &&
        status == other.status &&
        ownerId == other.ownerId &&
        createdById == other.createdById &&
        updatedById == other.updatedById &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt &&
        deletedAt == other.deletedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, ownerId.hashCode);
    _$hash = $jc(_$hash, createdById.hashCode);
    _$hash = $jc(_$hash, updatedById.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jc(_$hash, deletedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ProjectDto')
          ..add('id', id)
          ..add('name', name)
          ..add('description', description)
          ..add('status', status)
          ..add('ownerId', ownerId)
          ..add('createdById', createdById)
          ..add('updatedById', updatedById)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt)
          ..add('deletedAt', deletedAt))
        .toString();
  }
}

class ProjectDtoBuilder implements Builder<ProjectDto, ProjectDtoBuilder> {
  _$ProjectDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  JsonObject? _description;
  JsonObject? get description => _$this._description;
  set description(JsonObject? description) => _$this._description = description;

  ProjectDtoStatusEnum? _status;
  ProjectDtoStatusEnum? get status => _$this._status;
  set status(ProjectDtoStatusEnum? status) => _$this._status = status;

  String? _ownerId;
  String? get ownerId => _$this._ownerId;
  set ownerId(String? ownerId) => _$this._ownerId = ownerId;

  String? _createdById;
  String? get createdById => _$this._createdById;
  set createdById(String? createdById) => _$this._createdById = createdById;

  JsonObject? _updatedById;
  JsonObject? get updatedById => _$this._updatedById;
  set updatedById(JsonObject? updatedById) => _$this._updatedById = updatedById;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  JsonObject? _deletedAt;
  JsonObject? get deletedAt => _$this._deletedAt;
  set deletedAt(JsonObject? deletedAt) => _$this._deletedAt = deletedAt;

  ProjectDtoBuilder() {
    ProjectDto._defaults(this);
  }

  ProjectDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _name = $v.name;
      _description = $v.description;
      _status = $v.status;
      _ownerId = $v.ownerId;
      _createdById = $v.createdById;
      _updatedById = $v.updatedById;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _deletedAt = $v.deletedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ProjectDto other) {
    _$v = other as _$ProjectDto;
  }

  @override
  void update(void Function(ProjectDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ProjectDto build() => _build();

  _$ProjectDto _build() {
    final _$result =
        _$v ??
        _$ProjectDto._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'ProjectDto', 'id'),
          name: BuiltValueNullFieldError.checkNotNull(
            name,
            r'ProjectDto',
            'name',
          ),
          description: description,
          status: BuiltValueNullFieldError.checkNotNull(
            status,
            r'ProjectDto',
            'status',
          ),
          ownerId: BuiltValueNullFieldError.checkNotNull(
            ownerId,
            r'ProjectDto',
            'ownerId',
          ),
          createdById: BuiltValueNullFieldError.checkNotNull(
            createdById,
            r'ProjectDto',
            'createdById',
          ),
          updatedById: updatedById,
          createdAt: BuiltValueNullFieldError.checkNotNull(
            createdAt,
            r'ProjectDto',
            'createdAt',
          ),
          updatedAt: BuiltValueNullFieldError.checkNotNull(
            updatedAt,
            r'ProjectDto',
            'updatedAt',
          ),
          deletedAt: deletedAt,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
