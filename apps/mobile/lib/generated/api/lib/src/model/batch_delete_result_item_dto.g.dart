// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'batch_delete_result_item_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$BatchDeleteResultItemDto extends BatchDeleteResultItemDto {
  @override
  final String? error;
  @override
  final String fileId;
  @override
  final bool success;

  factory _$BatchDeleteResultItemDto([
    void Function(BatchDeleteResultItemDtoBuilder)? updates,
  ]) =>
      (BatchDeleteResultItemDtoBuilder()..update(updates))._build();

  _$BatchDeleteResultItemDto._({
    this.error,
    required this.fileId,
    required this.success,
  }) : super._();
  @override
  BatchDeleteResultItemDto rebuild(
    void Function(BatchDeleteResultItemDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  BatchDeleteResultItemDtoBuilder toBuilder() =>
      BatchDeleteResultItemDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is BatchDeleteResultItemDto &&
        error == other.error &&
        fileId == other.fileId &&
        success == other.success;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, error.hashCode);
    _$hash = $jc(_$hash, fileId.hashCode);
    _$hash = $jc(_$hash, success.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'BatchDeleteResultItemDto')
          ..add('error', error)
          ..add('fileId', fileId)
          ..add('success', success))
        .toString();
  }
}

class BatchDeleteResultItemDtoBuilder
    implements
        Builder<BatchDeleteResultItemDto, BatchDeleteResultItemDtoBuilder> {
  _$BatchDeleteResultItemDto? _$v;

  String? _error;
  String? get error => _$this._error;
  set error(String? error) => _$this._error = error;

  String? _fileId;
  String? get fileId => _$this._fileId;
  set fileId(String? fileId) => _$this._fileId = fileId;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  BatchDeleteResultItemDtoBuilder() {
    BatchDeleteResultItemDto._defaults(this);
  }

  BatchDeleteResultItemDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _error = $v.error;
      _fileId = $v.fileId;
      _success = $v.success;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(BatchDeleteResultItemDto other) {
    _$v = other as _$BatchDeleteResultItemDto;
  }

  @override
  void update(void Function(BatchDeleteResultItemDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  BatchDeleteResultItemDto build() => _build();

  _$BatchDeleteResultItemDto _build() {
    final _$result = _$v ??
        _$BatchDeleteResultItemDto._(
          error: error,
          fileId: BuiltValueNullFieldError.checkNotNull(
            fileId,
            r'BatchDeleteResultItemDto',
            'fileId',
          ),
          success: BuiltValueNullFieldError.checkNotNull(
            success,
            r'BatchDeleteResultItemDto',
            'success',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
