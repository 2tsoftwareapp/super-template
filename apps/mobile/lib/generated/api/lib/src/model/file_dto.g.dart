// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'file_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$FileDto extends FileDto {
  @override
  final String id;
  @override
  final String storageKey;
  @override
  final String originalName;
  @override
  final String mimeType;
  @override
  final num sizeBytes;
  @override
  final JsonObject? uploadedById;
  @override
  final String createdAt;
  @override
  final String updatedAt;

  factory _$FileDto([void Function(FileDtoBuilder)? updates]) =>
      (FileDtoBuilder()..update(updates))._build();

  _$FileDto._({
    required this.id,
    required this.storageKey,
    required this.originalName,
    required this.mimeType,
    required this.sizeBytes,
    this.uploadedById,
    required this.createdAt,
    required this.updatedAt,
  }) : super._();
  @override
  FileDto rebuild(void Function(FileDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  FileDtoBuilder toBuilder() => FileDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is FileDto &&
        id == other.id &&
        storageKey == other.storageKey &&
        originalName == other.originalName &&
        mimeType == other.mimeType &&
        sizeBytes == other.sizeBytes &&
        uploadedById == other.uploadedById &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, storageKey.hashCode);
    _$hash = $jc(_$hash, originalName.hashCode);
    _$hash = $jc(_$hash, mimeType.hashCode);
    _$hash = $jc(_$hash, sizeBytes.hashCode);
    _$hash = $jc(_$hash, uploadedById.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'FileDto')
          ..add('id', id)
          ..add('storageKey', storageKey)
          ..add('originalName', originalName)
          ..add('mimeType', mimeType)
          ..add('sizeBytes', sizeBytes)
          ..add('uploadedById', uploadedById)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class FileDtoBuilder implements Builder<FileDto, FileDtoBuilder> {
  _$FileDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _storageKey;
  String? get storageKey => _$this._storageKey;
  set storageKey(String? storageKey) => _$this._storageKey = storageKey;

  String? _originalName;
  String? get originalName => _$this._originalName;
  set originalName(String? originalName) => _$this._originalName = originalName;

  String? _mimeType;
  String? get mimeType => _$this._mimeType;
  set mimeType(String? mimeType) => _$this._mimeType = mimeType;

  num? _sizeBytes;
  num? get sizeBytes => _$this._sizeBytes;
  set sizeBytes(num? sizeBytes) => _$this._sizeBytes = sizeBytes;

  JsonObject? _uploadedById;
  JsonObject? get uploadedById => _$this._uploadedById;
  set uploadedById(JsonObject? uploadedById) =>
      _$this._uploadedById = uploadedById;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  FileDtoBuilder() {
    FileDto._defaults(this);
  }

  FileDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _storageKey = $v.storageKey;
      _originalName = $v.originalName;
      _mimeType = $v.mimeType;
      _sizeBytes = $v.sizeBytes;
      _uploadedById = $v.uploadedById;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(FileDto other) {
    _$v = other as _$FileDto;
  }

  @override
  void update(void Function(FileDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  FileDto build() => _build();

  _$FileDto _build() {
    final _$result = _$v ??
        _$FileDto._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'FileDto', 'id'),
          storageKey: BuiltValueNullFieldError.checkNotNull(
            storageKey,
            r'FileDto',
            'storageKey',
          ),
          originalName: BuiltValueNullFieldError.checkNotNull(
            originalName,
            r'FileDto',
            'originalName',
          ),
          mimeType: BuiltValueNullFieldError.checkNotNull(
            mimeType,
            r'FileDto',
            'mimeType',
          ),
          sizeBytes: BuiltValueNullFieldError.checkNotNull(
            sizeBytes,
            r'FileDto',
            'sizeBytes',
          ),
          uploadedById: uploadedById,
          createdAt: BuiltValueNullFieldError.checkNotNull(
            createdAt,
            r'FileDto',
            'createdAt',
          ),
          updatedAt: BuiltValueNullFieldError.checkNotNull(
            updatedAt,
            r'FileDto',
            'updatedAt',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
