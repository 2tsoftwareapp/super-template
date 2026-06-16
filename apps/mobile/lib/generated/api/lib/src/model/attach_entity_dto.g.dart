// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'attach_entity_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AttachEntityDto extends AttachEntityDto {
  @override
  final String fileId;
  @override
  final String entityType;
  @override
  final String entityId;
  @override
  final String? label;

  factory _$AttachEntityDto([void Function(AttachEntityDtoBuilder)? updates]) =>
      (AttachEntityDtoBuilder()..update(updates))._build();

  _$AttachEntityDto._(
      {required this.fileId,
      required this.entityType,
      required this.entityId,
      this.label})
      : super._();
  @override
  AttachEntityDto rebuild(void Function(AttachEntityDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AttachEntityDtoBuilder toBuilder() => AttachEntityDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AttachEntityDto &&
        fileId == other.fileId &&
        entityType == other.entityType &&
        entityId == other.entityId &&
        label == other.label;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, fileId.hashCode);
    _$hash = $jc(_$hash, entityType.hashCode);
    _$hash = $jc(_$hash, entityId.hashCode);
    _$hash = $jc(_$hash, label.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AttachEntityDto')
          ..add('fileId', fileId)
          ..add('entityType', entityType)
          ..add('entityId', entityId)
          ..add('label', label))
        .toString();
  }
}

class AttachEntityDtoBuilder
    implements Builder<AttachEntityDto, AttachEntityDtoBuilder> {
  _$AttachEntityDto? _$v;

  String? _fileId;
  String? get fileId => _$this._fileId;
  set fileId(String? fileId) => _$this._fileId = fileId;

  String? _entityType;
  String? get entityType => _$this._entityType;
  set entityType(String? entityType) => _$this._entityType = entityType;

  String? _entityId;
  String? get entityId => _$this._entityId;
  set entityId(String? entityId) => _$this._entityId = entityId;

  String? _label;
  String? get label => _$this._label;
  set label(String? label) => _$this._label = label;

  AttachEntityDtoBuilder() {
    AttachEntityDto._defaults(this);
  }

  AttachEntityDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _fileId = $v.fileId;
      _entityType = $v.entityType;
      _entityId = $v.entityId;
      _label = $v.label;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AttachEntityDto other) {
    _$v = other as _$AttachEntityDto;
  }

  @override
  void update(void Function(AttachEntityDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AttachEntityDto build() => _build();

  _$AttachEntityDto _build() {
    final _$result = _$v ??
        _$AttachEntityDto._(
          fileId: BuiltValueNullFieldError.checkNotNull(
              fileId, r'AttachEntityDto', 'fileId'),
          entityType: BuiltValueNullFieldError.checkNotNull(
              entityType, r'AttachEntityDto', 'entityType'),
          entityId: BuiltValueNullFieldError.checkNotNull(
              entityId, r'AttachEntityDto', 'entityId'),
          label: label,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
