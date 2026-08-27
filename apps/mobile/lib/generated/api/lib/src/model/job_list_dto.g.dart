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
  final num attempts;
  @override
  final JsonObject? cancelledAt;
  @override
  final JsonObject? completedAt;
  @override
  final String createdAt;
  @override
  final String? createdById;
  @override
  final JsonObject? errorMessage;
  @override
  final String id;
  @override
  final num maxAttempts;
  @override
  final JsonObject? organizationId;
  @override
  final BuiltMap<String, JsonObject?> payload;
  @override
  final num priority;
  @override
  final String scheduledAt;
  @override
  final JsonObject? startedAt;
  @override
  final JobListDtoStatusEnum status;
  @override
  final String type;
  @override
  final String updatedAt;

  factory _$JobListDto([void Function(JobListDtoBuilder)? updates]) =>
      (JobListDtoBuilder()..update(updates))._build();

  _$JobListDto._({
    required this.attempts,
    this.cancelledAt,
    this.completedAt,
    required this.createdAt,
    this.createdById,
    this.errorMessage,
    required this.id,
    required this.maxAttempts,
    this.organizationId,
    required this.payload,
    required this.priority,
    required this.scheduledAt,
    this.startedAt,
    required this.status,
    required this.type,
    required this.updatedAt,
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
        attempts == other.attempts &&
        cancelledAt == other.cancelledAt &&
        completedAt == other.completedAt &&
        createdAt == other.createdAt &&
        createdById == other.createdById &&
        errorMessage == other.errorMessage &&
        id == other.id &&
        maxAttempts == other.maxAttempts &&
        organizationId == other.organizationId &&
        payload == other.payload &&
        priority == other.priority &&
        scheduledAt == other.scheduledAt &&
        startedAt == other.startedAt &&
        status == other.status &&
        type == other.type &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, attempts.hashCode);
    _$hash = $jc(_$hash, cancelledAt.hashCode);
    _$hash = $jc(_$hash, completedAt.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, createdById.hashCode);
    _$hash = $jc(_$hash, errorMessage.hashCode);
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, maxAttempts.hashCode);
    _$hash = $jc(_$hash, organizationId.hashCode);
    _$hash = $jc(_$hash, payload.hashCode);
    _$hash = $jc(_$hash, priority.hashCode);
    _$hash = $jc(_$hash, scheduledAt.hashCode);
    _$hash = $jc(_$hash, startedAt.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'JobListDto')
          ..add('attempts', attempts)
          ..add('cancelledAt', cancelledAt)
          ..add('completedAt', completedAt)
          ..add('createdAt', createdAt)
          ..add('createdById', createdById)
          ..add('errorMessage', errorMessage)
          ..add('id', id)
          ..add('maxAttempts', maxAttempts)
          ..add('organizationId', organizationId)
          ..add('payload', payload)
          ..add('priority', priority)
          ..add('scheduledAt', scheduledAt)
          ..add('startedAt', startedAt)
          ..add('status', status)
          ..add('type', type)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class JobListDtoBuilder implements Builder<JobListDto, JobListDtoBuilder> {
  _$JobListDto? _$v;

  num? _attempts;
  num? get attempts => _$this._attempts;
  set attempts(num? attempts) => _$this._attempts = attempts;

  JsonObject? _cancelledAt;
  JsonObject? get cancelledAt => _$this._cancelledAt;
  set cancelledAt(JsonObject? cancelledAt) => _$this._cancelledAt = cancelledAt;

  JsonObject? _completedAt;
  JsonObject? get completedAt => _$this._completedAt;
  set completedAt(JsonObject? completedAt) => _$this._completedAt = completedAt;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _createdById;
  String? get createdById => _$this._createdById;
  set createdById(String? createdById) => _$this._createdById = createdById;

  JsonObject? _errorMessage;
  JsonObject? get errorMessage => _$this._errorMessage;
  set errorMessage(JsonObject? errorMessage) =>
      _$this._errorMessage = errorMessage;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  num? _maxAttempts;
  num? get maxAttempts => _$this._maxAttempts;
  set maxAttempts(num? maxAttempts) => _$this._maxAttempts = maxAttempts;

  JsonObject? _organizationId;
  JsonObject? get organizationId => _$this._organizationId;
  set organizationId(JsonObject? organizationId) =>
      _$this._organizationId = organizationId;

  MapBuilder<String, JsonObject?>? _payload;
  MapBuilder<String, JsonObject?> get payload =>
      _$this._payload ??= MapBuilder<String, JsonObject?>();
  set payload(MapBuilder<String, JsonObject?>? payload) =>
      _$this._payload = payload;

  num? _priority;
  num? get priority => _$this._priority;
  set priority(num? priority) => _$this._priority = priority;

  String? _scheduledAt;
  String? get scheduledAt => _$this._scheduledAt;
  set scheduledAt(String? scheduledAt) => _$this._scheduledAt = scheduledAt;

  JsonObject? _startedAt;
  JsonObject? get startedAt => _$this._startedAt;
  set startedAt(JsonObject? startedAt) => _$this._startedAt = startedAt;

  JobListDtoStatusEnum? _status;
  JobListDtoStatusEnum? get status => _$this._status;
  set status(JobListDtoStatusEnum? status) => _$this._status = status;

  String? _type;
  String? get type => _$this._type;
  set type(String? type) => _$this._type = type;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  JobListDtoBuilder() {
    JobListDto._defaults(this);
  }

  JobListDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _attempts = $v.attempts;
      _cancelledAt = $v.cancelledAt;
      _completedAt = $v.completedAt;
      _createdAt = $v.createdAt;
      _createdById = $v.createdById;
      _errorMessage = $v.errorMessage;
      _id = $v.id;
      _maxAttempts = $v.maxAttempts;
      _organizationId = $v.organizationId;
      _payload = $v.payload.toBuilder();
      _priority = $v.priority;
      _scheduledAt = $v.scheduledAt;
      _startedAt = $v.startedAt;
      _status = $v.status;
      _type = $v.type;
      _updatedAt = $v.updatedAt;
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
            attempts: BuiltValueNullFieldError.checkNotNull(
              attempts,
              r'JobListDto',
              'attempts',
            ),
            cancelledAt: cancelledAt,
            completedAt: completedAt,
            createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt,
              r'JobListDto',
              'createdAt',
            ),
            createdById: createdById,
            errorMessage: errorMessage,
            id: BuiltValueNullFieldError.checkNotNull(id, r'JobListDto', 'id'),
            maxAttempts: BuiltValueNullFieldError.checkNotNull(
              maxAttempts,
              r'JobListDto',
              'maxAttempts',
            ),
            organizationId: organizationId,
            payload: payload.build(),
            priority: BuiltValueNullFieldError.checkNotNull(
              priority,
              r'JobListDto',
              'priority',
            ),
            scheduledAt: BuiltValueNullFieldError.checkNotNull(
              scheduledAt,
              r'JobListDto',
              'scheduledAt',
            ),
            startedAt: startedAt,
            status: BuiltValueNullFieldError.checkNotNull(
              status,
              r'JobListDto',
              'status',
            ),
            type: BuiltValueNullFieldError.checkNotNull(
              type,
              r'JobListDto',
              'type',
            ),
            updatedAt: BuiltValueNullFieldError.checkNotNull(
              updatedAt,
              r'JobListDto',
              'updatedAt',
            ),
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
