// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'job_dependency_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const JobDependencyDtoDependsOnJobStatusEnum
    _$jobDependencyDtoDependsOnJobStatusEnum_PENDING =
    const JobDependencyDtoDependsOnJobStatusEnum._('PENDING');
const JobDependencyDtoDependsOnJobStatusEnum
    _$jobDependencyDtoDependsOnJobStatusEnum_PROCESSING =
    const JobDependencyDtoDependsOnJobStatusEnum._('PROCESSING');
const JobDependencyDtoDependsOnJobStatusEnum
    _$jobDependencyDtoDependsOnJobStatusEnum_COMPLETED =
    const JobDependencyDtoDependsOnJobStatusEnum._('COMPLETED');
const JobDependencyDtoDependsOnJobStatusEnum
    _$jobDependencyDtoDependsOnJobStatusEnum_CANCELLED =
    const JobDependencyDtoDependsOnJobStatusEnum._('CANCELLED');
const JobDependencyDtoDependsOnJobStatusEnum
    _$jobDependencyDtoDependsOnJobStatusEnum_FAILED =
    const JobDependencyDtoDependsOnJobStatusEnum._('FAILED');

JobDependencyDtoDependsOnJobStatusEnum
    _$jobDependencyDtoDependsOnJobStatusEnumValueOf(String name) {
  switch (name) {
    case 'PENDING':
      return _$jobDependencyDtoDependsOnJobStatusEnum_PENDING;
    case 'PROCESSING':
      return _$jobDependencyDtoDependsOnJobStatusEnum_PROCESSING;
    case 'COMPLETED':
      return _$jobDependencyDtoDependsOnJobStatusEnum_COMPLETED;
    case 'CANCELLED':
      return _$jobDependencyDtoDependsOnJobStatusEnum_CANCELLED;
    case 'FAILED':
      return _$jobDependencyDtoDependsOnJobStatusEnum_FAILED;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<JobDependencyDtoDependsOnJobStatusEnum>
    _$jobDependencyDtoDependsOnJobStatusEnumValues =
    BuiltSet<JobDependencyDtoDependsOnJobStatusEnum>(
  const <JobDependencyDtoDependsOnJobStatusEnum>[
    _$jobDependencyDtoDependsOnJobStatusEnum_PENDING,
    _$jobDependencyDtoDependsOnJobStatusEnum_PROCESSING,
    _$jobDependencyDtoDependsOnJobStatusEnum_COMPLETED,
    _$jobDependencyDtoDependsOnJobStatusEnum_CANCELLED,
    _$jobDependencyDtoDependsOnJobStatusEnum_FAILED,
  ],
);

Serializer<JobDependencyDtoDependsOnJobStatusEnum>
    _$jobDependencyDtoDependsOnJobStatusEnumSerializer =
    _$JobDependencyDtoDependsOnJobStatusEnumSerializer();

class _$JobDependencyDtoDependsOnJobStatusEnumSerializer
    implements PrimitiveSerializer<JobDependencyDtoDependsOnJobStatusEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'PENDING': 'PENDING',
    'PROCESSING': 'PROCESSING',
    'COMPLETED': 'COMPLETED',
    'CANCELLED': 'CANCELLED',
    'FAILED': 'FAILED',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'PENDING': 'PENDING',
    'PROCESSING': 'PROCESSING',
    'COMPLETED': 'COMPLETED',
    'CANCELLED': 'CANCELLED',
    'FAILED': 'FAILED',
  };

  @override
  final Iterable<Type> types = const <Type>[
    JobDependencyDtoDependsOnJobStatusEnum,
  ];
  @override
  final String wireName = 'JobDependencyDtoDependsOnJobStatusEnum';

  @override
  Object serialize(
    Serializers serializers,
    JobDependencyDtoDependsOnJobStatusEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  JobDependencyDtoDependsOnJobStatusEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      JobDependencyDtoDependsOnJobStatusEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$JobDependencyDto extends JobDependencyDto {
  @override
  final String id;
  @override
  final String dependsOnJobId;
  @override
  final JobDependencyDtoDependsOnJobStatusEnum dependsOnJobStatus;
  @override
  final String createdAt;

  factory _$JobDependencyDto([
    void Function(JobDependencyDtoBuilder)? updates,
  ]) =>
      (JobDependencyDtoBuilder()..update(updates))._build();

  _$JobDependencyDto._({
    required this.id,
    required this.dependsOnJobId,
    required this.dependsOnJobStatus,
    required this.createdAt,
  }) : super._();
  @override
  JobDependencyDto rebuild(void Function(JobDependencyDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  JobDependencyDtoBuilder toBuilder() =>
      JobDependencyDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is JobDependencyDto &&
        id == other.id &&
        dependsOnJobId == other.dependsOnJobId &&
        dependsOnJobStatus == other.dependsOnJobStatus &&
        createdAt == other.createdAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, dependsOnJobId.hashCode);
    _$hash = $jc(_$hash, dependsOnJobStatus.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'JobDependencyDto')
          ..add('id', id)
          ..add('dependsOnJobId', dependsOnJobId)
          ..add('dependsOnJobStatus', dependsOnJobStatus)
          ..add('createdAt', createdAt))
        .toString();
  }
}

class JobDependencyDtoBuilder
    implements Builder<JobDependencyDto, JobDependencyDtoBuilder> {
  _$JobDependencyDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _dependsOnJobId;
  String? get dependsOnJobId => _$this._dependsOnJobId;
  set dependsOnJobId(String? dependsOnJobId) =>
      _$this._dependsOnJobId = dependsOnJobId;

  JobDependencyDtoDependsOnJobStatusEnum? _dependsOnJobStatus;
  JobDependencyDtoDependsOnJobStatusEnum? get dependsOnJobStatus =>
      _$this._dependsOnJobStatus;
  set dependsOnJobStatus(
    JobDependencyDtoDependsOnJobStatusEnum? dependsOnJobStatus,
  ) =>
      _$this._dependsOnJobStatus = dependsOnJobStatus;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  JobDependencyDtoBuilder() {
    JobDependencyDto._defaults(this);
  }

  JobDependencyDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _dependsOnJobId = $v.dependsOnJobId;
      _dependsOnJobStatus = $v.dependsOnJobStatus;
      _createdAt = $v.createdAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(JobDependencyDto other) {
    _$v = other as _$JobDependencyDto;
  }

  @override
  void update(void Function(JobDependencyDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  JobDependencyDto build() => _build();

  _$JobDependencyDto _build() {
    final _$result = _$v ??
        _$JobDependencyDto._(
          id: BuiltValueNullFieldError.checkNotNull(
            id,
            r'JobDependencyDto',
            'id',
          ),
          dependsOnJobId: BuiltValueNullFieldError.checkNotNull(
            dependsOnJobId,
            r'JobDependencyDto',
            'dependsOnJobId',
          ),
          dependsOnJobStatus: BuiltValueNullFieldError.checkNotNull(
            dependsOnJobStatus,
            r'JobDependencyDto',
            'dependsOnJobStatus',
          ),
          createdAt: BuiltValueNullFieldError.checkNotNull(
            createdAt,
            r'JobDependencyDto',
            'createdAt',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
