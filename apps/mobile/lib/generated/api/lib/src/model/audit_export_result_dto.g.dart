// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'audit_export_result_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuditExportResultDto extends AuditExportResultDto {
  @override
  final String fileId;
  @override
  final num rowCount;
  @override
  final num totalMatching;
  @override
  final bool truncated;

  factory _$AuditExportResultDto([
    void Function(AuditExportResultDtoBuilder)? updates,
  ]) =>
      (AuditExportResultDtoBuilder()..update(updates))._build();

  _$AuditExportResultDto._({
    required this.fileId,
    required this.rowCount,
    required this.totalMatching,
    required this.truncated,
  }) : super._();
  @override
  AuditExportResultDto rebuild(
    void Function(AuditExportResultDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AuditExportResultDtoBuilder toBuilder() =>
      AuditExportResultDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuditExportResultDto &&
        fileId == other.fileId &&
        rowCount == other.rowCount &&
        totalMatching == other.totalMatching &&
        truncated == other.truncated;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, fileId.hashCode);
    _$hash = $jc(_$hash, rowCount.hashCode);
    _$hash = $jc(_$hash, totalMatching.hashCode);
    _$hash = $jc(_$hash, truncated.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AuditExportResultDto')
          ..add('fileId', fileId)
          ..add('rowCount', rowCount)
          ..add('totalMatching', totalMatching)
          ..add('truncated', truncated))
        .toString();
  }
}

class AuditExportResultDtoBuilder
    implements Builder<AuditExportResultDto, AuditExportResultDtoBuilder> {
  _$AuditExportResultDto? _$v;

  String? _fileId;
  String? get fileId => _$this._fileId;
  set fileId(String? fileId) => _$this._fileId = fileId;

  num? _rowCount;
  num? get rowCount => _$this._rowCount;
  set rowCount(num? rowCount) => _$this._rowCount = rowCount;

  num? _totalMatching;
  num? get totalMatching => _$this._totalMatching;
  set totalMatching(num? totalMatching) =>
      _$this._totalMatching = totalMatching;

  bool? _truncated;
  bool? get truncated => _$this._truncated;
  set truncated(bool? truncated) => _$this._truncated = truncated;

  AuditExportResultDtoBuilder() {
    AuditExportResultDto._defaults(this);
  }

  AuditExportResultDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _fileId = $v.fileId;
      _rowCount = $v.rowCount;
      _totalMatching = $v.totalMatching;
      _truncated = $v.truncated;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuditExportResultDto other) {
    _$v = other as _$AuditExportResultDto;
  }

  @override
  void update(void Function(AuditExportResultDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AuditExportResultDto build() => _build();

  _$AuditExportResultDto _build() {
    final _$result = _$v ??
        _$AuditExportResultDto._(
          fileId: BuiltValueNullFieldError.checkNotNull(
            fileId,
            r'AuditExportResultDto',
            'fileId',
          ),
          rowCount: BuiltValueNullFieldError.checkNotNull(
            rowCount,
            r'AuditExportResultDto',
            'rowCount',
          ),
          totalMatching: BuiltValueNullFieldError.checkNotNull(
            totalMatching,
            r'AuditExportResultDto',
            'totalMatching',
          ),
          truncated: BuiltValueNullFieldError.checkNotNull(
            truncated,
            r'AuditExportResultDto',
            'truncated',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
