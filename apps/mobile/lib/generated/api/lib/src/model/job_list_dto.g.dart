// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'job_list_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const JobListDtoStatusEnum _$jobListDtoStatusEnum_PENDING =
    const JobListDtoStatusEnum._('PENDING');
const JobListDtoStatusEnum _$jobListDtoStatusEnum_PROCESSING =
    const JobListDtoStatusEnum._('PROCESSING');
const JobListDtoStatusEnum _$jobListDtoStatusEnum_COMPLETED =
    const JobListDtoStatusEnum._('COMPLETED');
const JobListDtoStatusEnum _$jobListDtoStatusEnum_CANCELLED =
    const JobListDtoStatusEnum._('CANCELLED');
const JobListDtoStatusEnum _$jobListDtoStatusEnum_FAILED =
    const JobListDtoStatusEnum._('FAILED');
const JobListDtoStatusEnum _$jobListDtoStatusEnum_BLOCKED =
    const JobListDtoStatusEnum._('BLOCKED');

JobListDtoStatusEnum _$jobListDtoStatusEnumValueOf(String name) {
  switch (name) {
    case 'PENDING':
      return _$jobListDtoStatusEnum_PENDING;
    case 'PROCESSING':
      return _$jobListDtoStatusEnum_PROCESSING;
    case 'COMPLETED':
      return _$jobListDtoStatusEnum_COMPLETED;
    case 'CANCELLED':
      return _$jobListDtoStatusEnum_CANCELLED;
    case 'FAILED':
      return _$jobListDtoStatusEnum_FAILED;
    case 'BLOCKED':
      return _$jobListDtoStatusEnum_BLOCKED;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<JobListDtoStatusEnum> _$jobListDtoStatusEnumValues =
    BuiltSet<JobListDtoStatusEnum>(const <JobListDtoStatusEnum>[
  _$jobListDtoStatusEnum_PENDING,
  _$jobListDtoStatusEnum_PROCESSING,
  _$jobListDtoStatusEnum_COMPLETED,
  _$jobListDtoStatusEnum_CANCELLED,
  _$jobListDtoStatusEnum_FAILED,
  _$jobListDtoStatusEnum_BLOCKED,
]);

Serializer<JobListDtoStatusEnum> _$jobListDtoStatusEnumSerializer =
    _$JobListDtoStatusEnumSerializer();

class _$JobListDtoStatusEnumSerializer
    implements PrimitiveSerializer<JobListDtoStatusEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'PENDING': 'PENDING',
    'PROCESSING': 'PROCESSING',
    'COMPLETED': 'COMPLETED',
    'CANCELLED': 'CANCELLED',
    'FAILED': 'FAILED',
    'BLOCKED': 'BLOCKED',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'PENDING': 'PENDING',
    'PROCESSING': 'PROCESSING',
    'COMPLETED': 'COMPLETED',
    'CANCELLED': 'CANCELLED',
    'FAILED': 'FAILED',
    'BLOCKED': 'BLOCKED',
  };

  @override
  final Iterable<Type> types = const <Type>[JobListDtoStatusEnum];
  @override
  final String wireName = 'JobListDtoStatusEnum';

  @override
  Object serialize(
    Serializers serializers,
    JobListDtoStatusEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  JobListDtoStatusEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      JobListDtoStatusEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$JobListDto extends JobListDto {
  @override
  final String id;
  @override
  final String type;
  @override
  final BuiltMap<String, JsonObject?> payload;
  @override
  final JobListDtoStatusEnum status;
  @override
  final String scheduledAt;
  @override
  final num priority;
  @override
  final num attempts;
  @override
  final num maxAttempts;
  @override
  final JsonObject? startedAt;
  @override
  final JsonObject? completedAt;
  @override
  final JsonObject? cancelledAt;
  @override
  final JsonObject? errorMessage;
  @override
  final String? createdById;
  @override
  final String createdAt;
  @override
  final String updatedAt;
  @override
  final JsonObject? organizationId;

  factory _$JobListDto([void Function(JobListDtoBuilder)? updates]) =>
      (JobListDtoBuilder()..update(updates))._build();

  _$JobListDto._({
    required this.id,
    required this.type,
    required this.payload,
    required this.status,
    required this.scheduledAt,
    required this.priority,
    required this.attempts,
    required this.maxAttempts,
    this.startedAt,
    this.completedAt,
    this.cancelledAt,
    this.errorMessage,
    this.createdById,
    required this.createdAt,
    required this.updatedAt,
    this.organizationId,
  }) : super._();
  @override
  JobListDto rebuild(void Function(JobListDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  JobListDtoBuilder toBuilder() => JobListDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is JobListDto &&
        id == other.id &&
        type == other.type &&
        payload == other.payload &&
        status == other.status &&
        scheduledAt == other.scheduledAt &&
        priority == other.priority &&
        attempts == other.attempts &&
        maxAttempts == other.maxAttempts &&
        startedAt == other.startedAt &&
        completedAt == other.completedAt &&
        cancelledAt == other.cancelledAt &&
        errorMessage == other.errorMessage &&
        createdById == other.createdById &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt &&
        organizationId == other.organizationId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jc(_$hash, payload.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, scheduledAt.hashCode);
    _$hash = $jc(_$hash, priority.hashCode);
    _$hash = $jc(_$hash, attempts.hashCode);
    _$hash = $jc(_$hash, maxAttempts.hashCode);
    _$hash = $jc(_$hash, startedAt.hashCode);
    _$hash = $jc(_$hash, completedAt.hashCode);
    _$hash = $jc(_$hash, cancelledAt.hashCode);
    _$hash = $jc(_$hash, errorMessage.hashCode);
    _$hash = $jc(_$hash, createdById.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jc(_$hash, organizationId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'JobListDto')
          ..add('id', id)
          ..add('type', type)
          ..add('payload', payload)
          ..add('status', status)
          ..add('scheduledAt', scheduledAt)
          ..add('priority', priority)
          ..add('attempts', attempts)
          ..add('maxAttempts', maxAttempts)
          ..add('startedAt', startedAt)
          ..add('completedAt', completedAt)
          ..add('cancelledAt', cancelledAt)
          ..add('errorMessage', errorMessage)
          ..add('createdById', createdById)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt)
          ..add('organizationId', organizationId))
        .toString();
  }
}

class JobListDtoBuilder implements Builder<JobListDto, JobListDtoBuilder> {
  _$JobListDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _type;
  String? get type => _$this._type;
  set type(String? type) => _$this._type = type;

  MapBuilder<String, JsonObject?>? _payload;
  MapBuilder<String, JsonObject?> get payload =>
      _$this._payload ??= MapBuilder<String, JsonObject?>();
  set payload(MapBuilder<String, JsonObject?>? payload) =>
      _$this._payload = payload;

  JobListDtoStatusEnum? _status;
  JobListDtoStatusEnum? get status => _$this._status;
  set status(JobListDtoStatusEnum? status) => _$this._status = status;

  String? _scheduledAt;
  String? get scheduledAt => _$this._scheduledAt;
  set scheduledAt(String? scheduledAt) => _$this._scheduledAt = scheduledAt;

  num? _priority;
  num? get priority => _$this._priority;
  set priority(num? priority) => _$this._priority = priority;

  num? _attempts;
  num? get attempts => _$this._attempts;
  set attempts(num? attempts) => _$this._attempts = attempts;

  num? _maxAttempts;
  num? get maxAttempts => _$this._maxAttempts;
  set maxAttempts(num? maxAttempts) => _$this._maxAttempts = maxAttempts;

  JsonObject? _startedAt;
  JsonObject? get startedAt => _$this._startedAt;
  set startedAt(JsonObject? startedAt) => _$this._startedAt = startedAt;

  JsonObject? _completedAt;
  JsonObject? get completedAt => _$this._completedAt;
  set completedAt(JsonObject? completedAt) => _$this._completedAt = completedAt;

  JsonObject? _cancelledAt;
  JsonObject? get cancelledAt => _$this._cancelledAt;
  set cancelledAt(JsonObject? cancelledAt) => _$this._cancelledAt = cancelledAt;

  JsonObject? _errorMessage;
  JsonObject? get errorMessage => _$this._errorMessage;
  set errorMessage(JsonObject? errorMessage) =>
      _$this._errorMessage = errorMessage;

  String? _createdById;
  String? get createdById => _$this._createdById;
  set createdById(String? createdById) => _$this._createdById = createdById;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  JsonObject? _organizationId;
  JsonObject? get organizationId => _$this._organizationId;
  set organizationId(JsonObject? organizationId) =>
      _$this._organizationId = organizationId;

  JobListDtoBuilder() {
    JobListDto._defaults(this);
  }

  JobListDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _type = $v.type;
      _payload = $v.payload.toBuilder();
      _status = $v.status;
      _scheduledAt = $v.scheduledAt;
      _priority = $v.priority;
      _attempts = $v.attempts;
      _maxAttempts = $v.maxAttempts;
      _startedAt = $v.startedAt;
      _completedAt = $v.completedAt;
      _cancelledAt = $v.cancelledAt;
      _errorMessage = $v.errorMessage;
      _createdById = $v.createdById;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _organizationId = $v.organizationId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(JobListDto other) {
    _$v = other as _$JobListDto;
  }

  @override
  void update(void Function(JobListDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  JobListDto build() => _build();

  _$JobListDto _build() {
    _$JobListDto _$result;
    try {
      _$result = _$v ??
          _$JobListDto._(
            id: BuiltValueNullFieldError.checkNotNull(id, r'JobListDto', 'id'),
            type: BuiltValueNullFieldError.checkNotNull(
              type,
              r'JobListDto',
              'type',
            ),
            payload: payload.build(),
            status: BuiltValueNullFieldError.checkNotNull(
              status,
              r'JobListDto',
              'status',
            ),
            scheduledAt: BuiltValueNullFieldError.checkNotNull(
              scheduledAt,
              r'JobListDto',
              'scheduledAt',
            ),
            priority: BuiltValueNullFieldError.checkNotNull(
              priority,
              r'JobListDto',
              'priority',
            ),
            attempts: BuiltValueNullFieldError.checkNotNull(
              attempts,
              r'JobListDto',
              'attempts',
            ),
            maxAttempts: BuiltValueNullFieldError.checkNotNull(
              maxAttempts,
              r'JobListDto',
              'maxAttempts',
            ),
            startedAt: startedAt,
            completedAt: completedAt,
            cancelledAt: cancelledAt,
            errorMessage: errorMessage,
            createdById: createdById,
            createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt,
              r'JobListDto',
              'createdAt',
            ),
            updatedAt: BuiltValueNullFieldError.checkNotNull(
              updatedAt,
              r'JobListDto',
              'updatedAt',
            ),
            organizationId: organizationId,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'payload';
        payload.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'JobListDto',
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
