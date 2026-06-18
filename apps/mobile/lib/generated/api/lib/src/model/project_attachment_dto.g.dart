// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'project_attachment_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ProjectAttachmentDto extends ProjectAttachmentDto {
  @override
  final String id;
  @override
  final String fileId;
  @override
  final String entityType;
  @override
  final String entityId;
  @override
  final JsonObject? label;
  @override
  final JsonObject? createdById;
  @override
  final String createdAt;
  @override
  final String updatedAt;

  factory _$ProjectAttachmentDto([
    void Function(ProjectAttachmentDtoBuilder)? updates,
  ]) =>
      (ProjectAttachmentDtoBuilder()..update(updates))._build();

  _$ProjectAttachmentDto._({
    required this.id,
    required this.fileId,
    required this.entityType,
    required this.entityId,
    this.label,
    this.createdById,
    required this.createdAt,
    required this.updatedAt,
  }) : super._();
  @override
  ProjectAttachmentDto rebuild(
    void Function(ProjectAttachmentDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  ProjectAttachmentDtoBuilder toBuilder() =>
      ProjectAttachmentDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ProjectAttachmentDto &&
        id == other.id &&
        fileId == other.fileId &&
        entityType == other.entityType &&
        entityId == other.entityId &&
        label == other.label &&
        createdById == other.createdById &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, fileId.hashCode);
    _$hash = $jc(_$hash, entityType.hashCode);
    _$hash = $jc(_$hash, entityId.hashCode);
    _$hash = $jc(_$hash, label.hashCode);
    _$hash = $jc(_$hash, createdById.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ProjectAttachmentDto')
          ..add('id', id)
          ..add('fileId', fileId)
          ..add('entityType', entityType)
          ..add('entityId', entityId)
          ..add('label', label)
          ..add('createdById', createdById)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class ProjectAttachmentDtoBuilder
    implements Builder<ProjectAttachmentDto, ProjectAttachmentDtoBuilder> {
  _$ProjectAttachmentDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _fileId;
  String? get fileId => _$this._fileId;
  set fileId(String? fileId) => _$this._fileId = fileId;

  String? _entityType;
  String? get entityType => _$this._entityType;
  set entityType(String? entityType) => _$this._entityType = entityType;

  String? _entityId;
  String? get entityId => _$this._entityId;
  set entityId(String? entityId) => _$this._entityId = entityId;

  JsonObject? _label;
  JsonObject? get label => _$this._label;
  set label(JsonObject? label) => _$this._label = label;

  JsonObject? _createdById;
  JsonObject? get createdById => _$this._createdById;
  set createdById(JsonObject? createdById) => _$this._createdById = createdById;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  ProjectAttachmentDtoBuilder() {
    ProjectAttachmentDto._defaults(this);
  }

  ProjectAttachmentDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _fileId = $v.fileId;
      _entityType = $v.entityType;
      _entityId = $v.entityId;
      _label = $v.label;
      _createdById = $v.createdById;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ProjectAttachmentDto other) {
    _$v = other as _$ProjectAttachmentDto;
  }

  @override
  void update(void Function(ProjectAttachmentDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ProjectAttachmentDto build() => _build();

  _$ProjectAttachmentDto _build() {
    final _$result = _$v ??
        _$ProjectAttachmentDto._(
          id: BuiltValueNullFieldError.checkNotNull(
            id,
            r'ProjectAttachmentDto',
            'id',
          ),
          fileId: BuiltValueNullFieldError.checkNotNull(
            fileId,
            r'ProjectAttachmentDto',
            'fileId',
          ),
          entityType: BuiltValueNullFieldError.checkNotNull(
            entityType,
            r'ProjectAttachmentDto',
            'entityType',
          ),
          entityId: BuiltValueNullFieldError.checkNotNull(
            entityId,
            r'ProjectAttachmentDto',
            'entityId',
          ),
          label: label,
          createdById: createdById,
          createdAt: BuiltValueNullFieldError.checkNotNull(
            createdAt,
            r'ProjectAttachmentDto',
            'createdAt',
          ),
          updatedAt: BuiltValueNullFieldError.checkNotNull(
            updatedAt,
            r'ProjectAttachmentDto',
            'updatedAt',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
