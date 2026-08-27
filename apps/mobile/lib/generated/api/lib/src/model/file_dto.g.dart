// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'file_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$FileDto extends FileDto {
  @override
  final String? checksum;
  @override
  final String createdAt;
  @override
  final String id;
  @override
  final num latestVersion;
  @override
  final String mimeType;
  @override
  final String originalName;
  @override
  final num sizeBytes;
  @override
  final String updatedAt;
  @override
  final String? uploadedById;

  factory _$FileDto([void Function(FileDtoBuilder)? updates]) =>
      (FileDtoBuilder()..update(updates))._build();

  _$FileDto._({
    this.checksum,
    required this.createdAt,
    required this.id,
    required this.latestVersion,
    required this.mimeType,
    required this.originalName,
    required this.sizeBytes,
    required this.updatedAt,
    this.uploadedById,
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
        checksum == other.checksum &&
        createdAt == other.createdAt &&
        id == other.id &&
        latestVersion == other.latestVersion &&
        mimeType == other.mimeType &&
        originalName == other.originalName &&
        sizeBytes == other.sizeBytes &&
        updatedAt == other.updatedAt &&
        uploadedById == other.uploadedById;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, checksum.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, latestVersion.hashCode);
    _$hash = $jc(_$hash, mimeType.hashCode);
    _$hash = $jc(_$hash, originalName.hashCode);
    _$hash = $jc(_$hash, sizeBytes.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jc(_$hash, uploadedById.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'FileDto')
          ..add('checksum', checksum)
          ..add('createdAt', createdAt)
          ..add('id', id)
          ..add('latestVersion', latestVersion)
          ..add('mimeType', mimeType)
          ..add('originalName', originalName)
          ..add('sizeBytes', sizeBytes)
          ..add('updatedAt', updatedAt)
          ..add('uploadedById', uploadedById))
        .toString();
  }
}

class FileDtoBuilder implements Builder<FileDto, FileDtoBuilder> {
  _$FileDto? _$v;

  String? _checksum;
  String? get checksum => _$this._checksum;
  set checksum(String? checksum) => _$this._checksum = checksum;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  num? _latestVersion;
  num? get latestVersion => _$this._latestVersion;
  set latestVersion(num? latestVersion) =>
      _$this._latestVersion = latestVersion;

  String? _mimeType;
  String? get mimeType => _$this._mimeType;
  set mimeType(String? mimeType) => _$this._mimeType = mimeType;

  String? _originalName;
  String? get originalName => _$this._originalName;
  set originalName(String? originalName) => _$this._originalName = originalName;

  num? _sizeBytes;
  num? get sizeBytes => _$this._sizeBytes;
  set sizeBytes(num? sizeBytes) => _$this._sizeBytes = sizeBytes;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  String? _uploadedById;
  String? get uploadedById => _$this._uploadedById;
  set uploadedById(String? uploadedById) => _$this._uploadedById = uploadedById;

  FileDtoBuilder() {
    FileDto._defaults(this);
  }

  FileDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _checksum = $v.checksum;
      _createdAt = $v.createdAt;
      _id = $v.id;
      _latestVersion = $v.latestVersion;
      _mimeType = $v.mimeType;
      _originalName = $v.originalName;
      _sizeBytes = $v.sizeBytes;
      _updatedAt = $v.updatedAt;
      _uploadedById = $v.uploadedById;
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
          checksum: checksum,
          createdAt: BuiltValueNullFieldError.checkNotNull(
            createdAt,
            r'FileDto',
            'createdAt',
          ),
          id: BuiltValueNullFieldError.checkNotNull(id, r'FileDto', 'id'),
          latestVersion: BuiltValueNullFieldError.checkNotNull(
            latestVersion,
            r'FileDto',
            'latestVersion',
          ),
          mimeType: BuiltValueNullFieldError.checkNotNull(
            mimeType,
            r'FileDto',
            'mimeType',
          ),
          originalName: BuiltValueNullFieldError.checkNotNull(
            originalName,
            r'FileDto',
            'originalName',
          ),
          sizeBytes: BuiltValueNullFieldError.checkNotNull(
            sizeBytes,
            r'FileDto',
            'sizeBytes',
          ),
          updatedAt: BuiltValueNullFieldError.checkNotNull(
            updatedAt,
            r'FileDto',
            'updatedAt',
          ),
          uploadedById: uploadedById,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
