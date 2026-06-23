// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'batch_delete_files_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$BatchDeleteFilesDto extends BatchDeleteFilesDto {
  @override
  final BuiltList<String> fileIds;
  @override
  final String? idempotencyKey;

  factory _$BatchDeleteFilesDto([
    void Function(BatchDeleteFilesDtoBuilder)? updates,
  ]) =>
      (BatchDeleteFilesDtoBuilder()..update(updates))._build();

  _$BatchDeleteFilesDto._({required this.fileIds, this.idempotencyKey})
      : super._();
  @override
  BatchDeleteFilesDto rebuild(
    void Function(BatchDeleteFilesDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  BatchDeleteFilesDtoBuilder toBuilder() =>
      BatchDeleteFilesDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is BatchDeleteFilesDto &&
        fileIds == other.fileIds &&
        idempotencyKey == other.idempotencyKey;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, fileIds.hashCode);
    _$hash = $jc(_$hash, idempotencyKey.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'BatchDeleteFilesDto')
          ..add('fileIds', fileIds)
          ..add('idempotencyKey', idempotencyKey))
        .toString();
  }
}

class BatchDeleteFilesDtoBuilder
    implements Builder<BatchDeleteFilesDto, BatchDeleteFilesDtoBuilder> {
  _$BatchDeleteFilesDto? _$v;

  ListBuilder<String>? _fileIds;
  ListBuilder<String> get fileIds => _$this._fileIds ??= ListBuilder<String>();
  set fileIds(ListBuilder<String>? fileIds) => _$this._fileIds = fileIds;

  String? _idempotencyKey;
  String? get idempotencyKey => _$this._idempotencyKey;
  set idempotencyKey(String? idempotencyKey) =>
      _$this._idempotencyKey = idempotencyKey;

  BatchDeleteFilesDtoBuilder() {
    BatchDeleteFilesDto._defaults(this);
  }

  BatchDeleteFilesDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _fileIds = $v.fileIds.toBuilder();
      _idempotencyKey = $v.idempotencyKey;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(BatchDeleteFilesDto other) {
    _$v = other as _$BatchDeleteFilesDto;
  }

  @override
  void update(void Function(BatchDeleteFilesDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  BatchDeleteFilesDto build() => _build();

  _$BatchDeleteFilesDto _build() {
    _$BatchDeleteFilesDto _$result;
    try {
      _$result = _$v ??
          _$BatchDeleteFilesDto._(
            fileIds: fileIds.build(),
            idempotencyKey: idempotencyKey,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'fileIds';
        fileIds.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'BatchDeleteFilesDto',
          _$failedField,
          e.toString(),
        );
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
