// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'job_metrics_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$JobMetricsDto extends JobMetricsDto {
  @override
  final num? averageDurationMs;
  @override
  final BuiltList<JobStatusCountDto> byStatus;
  @override
  final BuiltList<JobTypeCountDto> byType;
  @override
  final num failureRate;
  @override
  final num retryRate;
  @override
  final num totalCompleted;
  @override
  final num totalFailed;

  factory _$JobMetricsDto([void Function(JobMetricsDtoBuilder)? updates]) =>
      (JobMetricsDtoBuilder()..update(updates))._build();

  _$JobMetricsDto._({
    this.averageDurationMs,
    required this.byStatus,
    required this.byType,
    required this.failureRate,
    required this.retryRate,
    required this.totalCompleted,
    required this.totalFailed,
  }) : super._();
  @override
  JobMetricsDto rebuild(void Function(JobMetricsDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  JobMetricsDtoBuilder toBuilder() => JobMetricsDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is JobMetricsDto &&
        averageDurationMs == other.averageDurationMs &&
        byStatus == other.byStatus &&
        byType == other.byType &&
        failureRate == other.failureRate &&
        retryRate == other.retryRate &&
        totalCompleted == other.totalCompleted &&
        totalFailed == other.totalFailed;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, averageDurationMs.hashCode);
    _$hash = $jc(_$hash, byStatus.hashCode);
    _$hash = $jc(_$hash, byType.hashCode);
    _$hash = $jc(_$hash, failureRate.hashCode);
    _$hash = $jc(_$hash, retryRate.hashCode);
    _$hash = $jc(_$hash, totalCompleted.hashCode);
    _$hash = $jc(_$hash, totalFailed.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'JobMetricsDto')
          ..add('averageDurationMs', averageDurationMs)
          ..add('byStatus', byStatus)
          ..add('byType', byType)
          ..add('failureRate', failureRate)
          ..add('retryRate', retryRate)
          ..add('totalCompleted', totalCompleted)
          ..add('totalFailed', totalFailed))
        .toString();
  }
}

class JobMetricsDtoBuilder
    implements Builder<JobMetricsDto, JobMetricsDtoBuilder> {
  _$JobMetricsDto? _$v;

  num? _averageDurationMs;
  num? get averageDurationMs => _$this._averageDurationMs;
  set averageDurationMs(num? averageDurationMs) =>
      _$this._averageDurationMs = averageDurationMs;

  ListBuilder<JobStatusCountDto>? _byStatus;
  ListBuilder<JobStatusCountDto> get byStatus =>
      _$this._byStatus ??= ListBuilder<JobStatusCountDto>();
  set byStatus(ListBuilder<JobStatusCountDto>? byStatus) =>
      _$this._byStatus = byStatus;

  ListBuilder<JobTypeCountDto>? _byType;
  ListBuilder<JobTypeCountDto> get byType =>
      _$this._byType ??= ListBuilder<JobTypeCountDto>();
  set byType(ListBuilder<JobTypeCountDto>? byType) => _$this._byType = byType;

  num? _failureRate;
  num? get failureRate => _$this._failureRate;
  set failureRate(num? failureRate) => _$this._failureRate = failureRate;

  num? _retryRate;
  num? get retryRate => _$this._retryRate;
  set retryRate(num? retryRate) => _$this._retryRate = retryRate;

  num? _totalCompleted;
  num? get totalCompleted => _$this._totalCompleted;
  set totalCompleted(num? totalCompleted) =>
      _$this._totalCompleted = totalCompleted;

  num? _totalFailed;
  num? get totalFailed => _$this._totalFailed;
  set totalFailed(num? totalFailed) => _$this._totalFailed = totalFailed;

  JobMetricsDtoBuilder() {
    JobMetricsDto._defaults(this);
  }

  JobMetricsDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _averageDurationMs = $v.averageDurationMs;
      _byStatus = $v.byStatus.toBuilder();
      _byType = $v.byType.toBuilder();
      _failureRate = $v.failureRate;
      _retryRate = $v.retryRate;
      _totalCompleted = $v.totalCompleted;
      _totalFailed = $v.totalFailed;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(JobMetricsDto other) {
    _$v = other as _$JobMetricsDto;
  }

  @override
  void update(void Function(JobMetricsDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  JobMetricsDto build() => _build();

  _$JobMetricsDto _build() {
    _$JobMetricsDto _$result;
    try {
      _$result = _$v ??
          _$JobMetricsDto._(
            averageDurationMs: averageDurationMs,
            byStatus: byStatus.build(),
            byType: byType.build(),
            failureRate: BuiltValueNullFieldError.checkNotNull(
              failureRate,
              r'JobMetricsDto',
              'failureRate',
            ),
            retryRate: BuiltValueNullFieldError.checkNotNull(
              retryRate,
              r'JobMetricsDto',
              'retryRate',
            ),
            totalCompleted: BuiltValueNullFieldError.checkNotNull(
              totalCompleted,
              r'JobMetricsDto',
              'totalCompleted',
            ),
            totalFailed: BuiltValueNullFieldError.checkNotNull(
              totalFailed,
              r'JobMetricsDto',
              'totalFailed',
            ),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'byStatus';
        byStatus.build();
        _$failedField = 'byType';
        byType.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'JobMetricsDto',
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
