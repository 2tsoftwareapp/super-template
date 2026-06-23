// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'job_status_count_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$JobStatusCountDto extends JobStatusCountDto {
  @override
  final String status;
  @override
  final num total;

  factory _$JobStatusCountDto([
    void Function(JobStatusCountDtoBuilder)? updates,
  ]) =>
      (JobStatusCountDtoBuilder()..update(updates))._build();

  _$JobStatusCountDto._({required this.status, required this.total})
      : super._();
  @override
  JobStatusCountDto rebuild(void Function(JobStatusCountDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  JobStatusCountDtoBuilder toBuilder() =>
      JobStatusCountDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is JobStatusCountDto &&
        status == other.status &&
        total == other.total;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, total.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'JobStatusCountDto')
          ..add('status', status)
          ..add('total', total))
        .toString();
  }
}

class JobStatusCountDtoBuilder
    implements Builder<JobStatusCountDto, JobStatusCountDtoBuilder> {
  _$JobStatusCountDto? _$v;

  String? _status;
  String? get status => _$this._status;
  set status(String? status) => _$this._status = status;

  num? _total;
  num? get total => _$this._total;
  set total(num? total) => _$this._total = total;

  JobStatusCountDtoBuilder() {
    JobStatusCountDto._defaults(this);
  }

  JobStatusCountDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _status = $v.status;
      _total = $v.total;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(JobStatusCountDto other) {
    _$v = other as _$JobStatusCountDto;
  }

  @override
  void update(void Function(JobStatusCountDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  JobStatusCountDto build() => _build();

  _$JobStatusCountDto _build() {
    final _$result = _$v ??
        _$JobStatusCountDto._(
          status: BuiltValueNullFieldError.checkNotNull(
            status,
            r'JobStatusCountDto',
            'status',
          ),
          total: BuiltValueNullFieldError.checkNotNull(
            total,
            r'JobStatusCountDto',
            'total',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
