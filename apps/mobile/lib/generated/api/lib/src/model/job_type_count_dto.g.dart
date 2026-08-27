// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'job_type_count_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$JobTypeCountDto extends JobTypeCountDto {
  @override
  final num total;
  @override
  final String type;

  factory _$JobTypeCountDto([void Function(JobTypeCountDtoBuilder)? updates]) =>
      (JobTypeCountDtoBuilder()..update(updates))._build();

  _$JobTypeCountDto._({required this.total, required this.type}) : super._();
  @override
  JobTypeCountDto rebuild(void Function(JobTypeCountDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  JobTypeCountDtoBuilder toBuilder() => JobTypeCountDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is JobTypeCountDto &&
        total == other.total &&
        type == other.type;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, total.hashCode);
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'JobTypeCountDto')
          ..add('total', total)
          ..add('type', type))
        .toString();
  }
}

class JobTypeCountDtoBuilder
    implements Builder<JobTypeCountDto, JobTypeCountDtoBuilder> {
  _$JobTypeCountDto? _$v;

  num? _total;
  num? get total => _$this._total;
  set total(num? total) => _$this._total = total;

  String? _type;
  String? get type => _$this._type;
  set type(String? type) => _$this._type = type;

  JobTypeCountDtoBuilder() {
    JobTypeCountDto._defaults(this);
  }

  JobTypeCountDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _total = $v.total;
      _type = $v.type;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(JobTypeCountDto other) {
    _$v = other as _$JobTypeCountDto;
  }

  @override
  void update(void Function(JobTypeCountDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  JobTypeCountDto build() => _build();

  _$JobTypeCountDto _build() {
    final _$result = _$v ??
        _$JobTypeCountDto._(
          total: BuiltValueNullFieldError.checkNotNull(
            total,
            r'JobTypeCountDto',
            'total',
          ),
          type: BuiltValueNullFieldError.checkNotNull(
            type,
            r'JobTypeCountDto',
            'type',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
