// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'attachment_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AttachmentDto extends AttachmentDto {
  @override
  final String createdAt;
  @override
  final String? createdById;
  @override
  final String entityId;
  @override
  final String entityType;
  @override
  final String fileId;
  @override
  final String id;
  @override
  final String? label;
  @override
  final String updatedAt;

  factory _$AttachmentDto([void Function(AttachmentDtoBuilder)? updates]) =>
      (AttachmentDtoBuilder()..update(updates))._build();

  _$AttachmentDto._({
    required this.createdAt,
    this.createdById,
    required this.entityId,
    required this.entityType,
    required this.fileId,
    required this.id,
    this.label,
    required this.updatedAt,
  }) : super._();
  @override
  AttachmentDto rebuild(void Function(AttachmentDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AttachmentDtoBuilder toBuilder() => AttachmentDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AttachmentDto &&
        createdAt == other.createdAt &&
        createdById == other.createdById &&
        entityId == other.entityId &&
        entityType == other.entityType &&
        fileId == other.fileId &&
        id == other.id &&
        label == other.label &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, createdById.hashCode);
    _$hash = $jc(_$hash, entityId.hashCode);
    _$hash = $jc(_$hash, entityType.hashCode);
    _$hash = $jc(_$hash, fileId.hashCode);
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, label.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AttachmentDto')
          ..add('createdAt', createdAt)
          ..add('createdById', createdById)
          ..add('entityId', entityId)
          ..add('entityType', entityType)
          ..add('fileId', fileId)
          ..add('id', id)
          ..add('label', label)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class AttachmentDtoBuilder
    implements Builder<AttachmentDto, AttachmentDtoBuilder> {
  _$AttachmentDto? _$v;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _createdById;
  String? get createdById => _$this._createdById;
  set createdById(String? createdById) => _$this._createdById = createdById;

  String? _entityId;
  String? get entityId => _$this._entityId;
  set entityId(String? entityId) => _$this._entityId = entityId;

  String? _entityType;
  String? get entityType => _$this._entityType;
  set entityType(String? entityType) => _$this._entityType = entityType;

  String? _fileId;
  String? get fileId => _$this._fileId;
  set fileId(String? fileId) => _$this._fileId = fileId;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _label;
  String? get label => _$this._label;
  set label(String? label) => _$this._label = label;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  AttachmentDtoBuilder() {
    AttachmentDto._defaults(this);
  }

  AttachmentDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _createdAt = $v.createdAt;
      _createdById = $v.createdById;
      _entityId = $v.entityId;
      _entityType = $v.entityType;
      _fileId = $v.fileId;
      _id = $v.id;
      _label = $v.label;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AttachmentDto other) {
    _$v = other as _$AttachmentDto;
  }

  @override
  void update(void Function(AttachmentDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AttachmentDto build() => _build();

  _$AttachmentDto _build() {
    final _$result = _$v ??
        _$AttachmentDto._(
          createdAt: BuiltValueNullFieldError.checkNotNull(
            createdAt,
            r'AttachmentDto',
            'createdAt',
          ),
          createdById: createdById,
          entityId: BuiltValueNullFieldError.checkNotNull(
            entityId,
            r'AttachmentDto',
            'entityId',
          ),
          entityType: BuiltValueNullFieldError.checkNotNull(
            entityType,
            r'AttachmentDto',
            'entityType',
          ),
          fileId: BuiltValueNullFieldError.checkNotNull(
            fileId,
            r'AttachmentDto',
            'fileId',
          ),
          id: BuiltValueNullFieldError.checkNotNull(id, r'AttachmentDto', 'id'),
          label: label,
          updatedAt: BuiltValueNullFieldError.checkNotNull(
            updatedAt,
            r'AttachmentDto',
            'updatedAt',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
