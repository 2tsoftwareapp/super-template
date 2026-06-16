// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'create_import_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateImportDto extends CreateImportDto {
  @override
  final String type;
  @override
  final String fileId;

  factory _$CreateImportDto([void Function(CreateImportDtoBuilder)? updates]) =>
      (CreateImportDtoBuilder()..update(updates))._build();

  _$CreateImportDto._({required this.type, required this.fileId}) : super._();
  @override
  CreateImportDto rebuild(void Function(CreateImportDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateImportDtoBuilder toBuilder() => CreateImportDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateImportDto &&
        type == other.type &&
        fileId == other.fileId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jc(_$hash, fileId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateImportDto')
          ..add('type', type)
          ..add('fileId', fileId))
        .toString();
  }
}

class CreateImportDtoBuilder
    implements Builder<CreateImportDto, CreateImportDtoBuilder> {
  _$CreateImportDto? _$v;

  String? _type;
  String? get type => _$this._type;
  set type(String? type) => _$this._type = type;

  String? _fileId;
  String? get fileId => _$this._fileId;
  set fileId(String? fileId) => _$this._fileId = fileId;

  CreateImportDtoBuilder() {
    CreateImportDto._defaults(this);
  }

  CreateImportDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _type = $v.type;
      _fileId = $v.fileId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateImportDto other) {
    _$v = other as _$CreateImportDto;
  }

  @override
  void update(void Function(CreateImportDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateImportDto build() => _build();

  _$CreateImportDto _build() {
    final _$result = _$v ??
        _$CreateImportDto._(
          type: BuiltValueNullFieldError.checkNotNull(
              type, r'CreateImportDto', 'type'),
          fileId: BuiltValueNullFieldError.checkNotNull(
              fileId, r'CreateImportDto', 'fileId'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
