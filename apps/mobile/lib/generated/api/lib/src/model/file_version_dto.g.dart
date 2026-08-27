// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'file_version_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$FileVersionDto extends FileVersionDto {
  @override
  final String checksum;
  @override
  final String createdAt;
  @override
  final String? createdById;
  @override
  final String fileId;
  @override
  final String id;
  @override
  final String mimeType;
  @override
  final num sizeBytes;
  @override
  final num versionNumber;

  factory _$FileVersionDto([void Function(FileVersionDtoBuilder)? updates]) =>
      (FileVersionDtoBuilder()..update(updates))._build();

  _$FileVersionDto._({
    required this.checksum,
    required this.createdAt,
    this.createdById,
    required this.fileId,
    required this.id,
    required this.mimeType,
    required this.sizeBytes,
    required this.versionNumber,
  }) : super._();
  @override
  FileVersionDto rebuild(void Function(FileVersionDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  FileVersionDtoBuilder toBuilder() => FileVersionDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is FileVersionDto &&
        checksum == other.checksum &&
        createdAt == other.createdAt &&
        createdById == other.createdById &&
        fileId == other.fileId &&
        id == other.id &&
        mimeType == other.mimeType &&
        sizeBytes == other.sizeBytes &&
        versionNumber == other.versionNumber;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, checksum.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, createdById.hashCode);
    _$hash = $jc(_$hash, fileId.hashCode);
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, mimeType.hashCode);
    _$hash = $jc(_$hash, sizeBytes.hashCode);
    _$hash = $jc(_$hash, versionNumber.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'FileVersionDto')
          ..add('checksum', checksum)
          ..add('createdAt', createdAt)
          ..add('createdById', createdById)
          ..add('fileId', fileId)
          ..add('id', id)
          ..add('mimeType', mimeType)
          ..add('sizeBytes', sizeBytes)
          ..add('versionNumber', versionNumber))
        .toString();
  }
}

class FileVersionDtoBuilder
    implements Builder<FileVersionDto, FileVersionDtoBuilder> {
  _$FileVersionDto? _$v;

  String? _checksum;
  String? get checksum => _$this._checksum;
  set checksum(String? checksum) => _$this._checksum = checksum;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _createdById;
  String? get createdById => _$this._createdById;
  set createdById(String? createdById) => _$this._createdById = createdById;

  String? _fileId;
  String? get fileId => _$this._fileId;
  set fileId(String? fileId) => _$this._fileId = fileId;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _mimeType;
  String? get mimeType => _$this._mimeType;
  set mimeType(String? mimeType) => _$this._mimeType = mimeType;

  num? _sizeBytes;
  num? get sizeBytes => _$this._sizeBytes;
  set sizeBytes(num? sizeBytes) => _$this._sizeBytes = sizeBytes;

  num? _versionNumber;
  num? get versionNumber => _$this._versionNumber;
  set versionNumber(num? versionNumber) =>
      _$this._versionNumber = versionNumber;

  FileVersionDtoBuilder() {
    FileVersionDto._defaults(this);
  }

  FileVersionDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _checksum = $v.checksum;
      _createdAt = $v.createdAt;
      _createdById = $v.createdById;
      _fileId = $v.fileId;
      _id = $v.id;
      _mimeType = $v.mimeType;
      _sizeBytes = $v.sizeBytes;
      _versionNumber = $v.versionNumber;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(FileVersionDto other) {
    _$v = other as _$FileVersionDto;
  }

  @override
  void update(void Function(FileVersionDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  FileVersionDto build() => _build();

  _$FileVersionDto _build() {
    final _$result = _$v ??
        _$FileVersionDto._(
          checksum: BuiltValueNullFieldError.checkNotNull(
            checksum,
            r'FileVersionDto',
            'checksum',
          ),
          createdAt: BuiltValueNullFieldError.checkNotNull(
            createdAt,
            r'FileVersionDto',
            'createdAt',
          ),
          createdById: createdById,
          fileId: BuiltValueNullFieldError.checkNotNull(
            fileId,
            r'FileVersionDto',
            'fileId',
          ),
          id: BuiltValueNullFieldError.checkNotNull(
            id,
            r'FileVersionDto',
            'id',
          ),
          mimeType: BuiltValueNullFieldError.checkNotNull(
            mimeType,
            r'FileVersionDto',
            'mimeType',
          ),
          sizeBytes: BuiltValueNullFieldError.checkNotNull(
            sizeBytes,
            r'FileVersionDto',
            'sizeBytes',
          ),
          versionNumber: BuiltValueNullFieldError.checkNotNull(
            versionNumber,
            r'FileVersionDto',
            'versionNumber',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
