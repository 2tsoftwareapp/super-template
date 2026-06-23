// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'file_version_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$FileVersionDto extends FileVersionDto {
  @override
  final String id;
  @override
  final String fileId;
  @override
  final num versionNumber;
  @override
  final String storageKey;
  @override
  final String mimeType;
  @override
  final num sizeBytes;
  @override
  final String checksum;
  @override
  final JsonObject? createdById;
  @override
  final String createdAt;

  factory _$FileVersionDto([void Function(FileVersionDtoBuilder)? updates]) =>
      (FileVersionDtoBuilder()..update(updates))._build();

  _$FileVersionDto._({
    required this.id,
    required this.fileId,
    required this.versionNumber,
    required this.storageKey,
    required this.mimeType,
    required this.sizeBytes,
    required this.checksum,
    this.createdById,
    required this.createdAt,
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
        id == other.id &&
        fileId == other.fileId &&
        versionNumber == other.versionNumber &&
        storageKey == other.storageKey &&
        mimeType == other.mimeType &&
        sizeBytes == other.sizeBytes &&
        checksum == other.checksum &&
        createdById == other.createdById &&
        createdAt == other.createdAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, fileId.hashCode);
    _$hash = $jc(_$hash, versionNumber.hashCode);
    _$hash = $jc(_$hash, storageKey.hashCode);
    _$hash = $jc(_$hash, mimeType.hashCode);
    _$hash = $jc(_$hash, sizeBytes.hashCode);
    _$hash = $jc(_$hash, checksum.hashCode);
    _$hash = $jc(_$hash, createdById.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'FileVersionDto')
          ..add('id', id)
          ..add('fileId', fileId)
          ..add('versionNumber', versionNumber)
          ..add('storageKey', storageKey)
          ..add('mimeType', mimeType)
          ..add('sizeBytes', sizeBytes)
          ..add('checksum', checksum)
          ..add('createdById', createdById)
          ..add('createdAt', createdAt))
        .toString();
  }
}

class FileVersionDtoBuilder
    implements Builder<FileVersionDto, FileVersionDtoBuilder> {
  _$FileVersionDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _fileId;
  String? get fileId => _$this._fileId;
  set fileId(String? fileId) => _$this._fileId = fileId;

  num? _versionNumber;
  num? get versionNumber => _$this._versionNumber;
  set versionNumber(num? versionNumber) =>
      _$this._versionNumber = versionNumber;

  String? _storageKey;
  String? get storageKey => _$this._storageKey;
  set storageKey(String? storageKey) => _$this._storageKey = storageKey;

  String? _mimeType;
  String? get mimeType => _$this._mimeType;
  set mimeType(String? mimeType) => _$this._mimeType = mimeType;

  num? _sizeBytes;
  num? get sizeBytes => _$this._sizeBytes;
  set sizeBytes(num? sizeBytes) => _$this._sizeBytes = sizeBytes;

  String? _checksum;
  String? get checksum => _$this._checksum;
  set checksum(String? checksum) => _$this._checksum = checksum;

  JsonObject? _createdById;
  JsonObject? get createdById => _$this._createdById;
  set createdById(JsonObject? createdById) => _$this._createdById = createdById;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  FileVersionDtoBuilder() {
    FileVersionDto._defaults(this);
  }

  FileVersionDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _fileId = $v.fileId;
      _versionNumber = $v.versionNumber;
      _storageKey = $v.storageKey;
      _mimeType = $v.mimeType;
      _sizeBytes = $v.sizeBytes;
      _checksum = $v.checksum;
      _createdById = $v.createdById;
      _createdAt = $v.createdAt;
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
          id: BuiltValueNullFieldError.checkNotNull(
            id,
            r'FileVersionDto',
            'id',
          ),
          fileId: BuiltValueNullFieldError.checkNotNull(
            fileId,
            r'FileVersionDto',
            'fileId',
          ),
          versionNumber: BuiltValueNullFieldError.checkNotNull(
            versionNumber,
            r'FileVersionDto',
            'versionNumber',
          ),
          storageKey: BuiltValueNullFieldError.checkNotNull(
            storageKey,
            r'FileVersionDto',
            'storageKey',
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
          checksum: BuiltValueNullFieldError.checkNotNull(
            checksum,
            r'FileVersionDto',
            'checksum',
          ),
          createdById: createdById,
          createdAt: BuiltValueNullFieldError.checkNotNull(
            createdAt,
            r'FileVersionDto',
            'createdAt',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
