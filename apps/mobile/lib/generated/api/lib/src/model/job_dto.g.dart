// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'job_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const JobDtoStatusEnum _$jobDtoStatusEnum_PENDING = const JobDtoStatusEnum._(
  'PENDING',
);
const JobDtoStatusEnum _$jobDtoStatusEnum_PROCESSING = const JobDtoStatusEnum._(
  'PROCESSING',
);
const JobDtoStatusEnum _$jobDtoStatusEnum_COMPLETED = const JobDtoStatusEnum._(
  'COMPLETED',
);
const JobDtoStatusEnum _$jobDtoStatusEnum_CANCELLED = const JobDtoStatusEnum._(
  'CANCELLED',
);
const JobDtoStatusEnum _$jobDtoStatusEnum_FAILED = const JobDtoStatusEnum._(
  'FAILED',
);
const JobDtoStatusEnum _$jobDtoStatusEnum_BLOCKED = const JobDtoStatusEnum._(
  'BLOCKED',
);

JobDtoStatusEnum _$jobDtoStatusEnumValueOf(String name) {
  switch (name) {
    case 'PENDING':
      return _$jobDtoStatusEnum_PENDING;
    case 'PROCESSING':
      return _$jobDtoStatusEnum_PROCESSING;
    case 'COMPLETED':
      return _$jobDtoStatusEnum_COMPLETED;
    case 'CANCELLED':
      return _$jobDtoStatusEnum_CANCELLED;
    case 'FAILED':
      return _$jobDtoStatusEnum_FAILED;
    case 'BLOCKED':
      return _$jobDtoStatusEnum_BLOCKED;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<JobDtoStatusEnum> _$jobDtoStatusEnumValues =
    BuiltSet<JobDtoStatusEnum>(const <JobDtoStatusEnum>[
  _$jobDtoStatusEnum_PENDING,
  _$jobDtoStatusEnum_PROCESSING,
  _$jobDtoStatusEnum_COMPLETED,
  _$jobDtoStatusEnum_CANCELLED,
  _$jobDtoStatusEnum_FAILED,
  _$jobDtoStatusEnum_BLOCKED,
]);

Serializer<JobDtoStatusEnum> _$jobDtoStatusEnumSerializer =
    _$JobDtoStatusEnumSerializer();

class _$JobDtoStatusEnumSerializer
    implements PrimitiveSerializer<JobDtoStatusEnum> {
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
  final Iterable<Type> types = const <Type>[JobDtoStatusEnum];
  @override
  final String wireName = 'JobDtoStatusEnum';

  @override
  Object serialize(
    Serializers serializers,
    JobDtoStatusEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  JobDtoStatusEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      JobDtoStatusEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$JobDto extends JobDto {
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
  final JobDtoStatusEnum status;
  @override
  final String type;
  @override
  final String updatedAt;

  factory _$JobDto([void Function(JobDtoBuilder)? updates]) =>
      (JobDtoBuilder()..update(updates))._build();

  _$JobDto._({
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
  JobDto rebuild(void Function(JobDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  JobDtoBuilder toBuilder() => JobDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is JobDto &&
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
    return (newBuiltValueToStringHelper(r'JobDto')
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

class JobDtoBuilder implements Builder<JobDto, JobDtoBuilder> {
  _$JobDto? _$v;

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

  JobDtoStatusEnum? _status;
  JobDtoStatusEnum? get status => _$this._status;
  set status(JobDtoStatusEnum? status) => _$this._status = status;

  String? _type;
  String? get type => _$this._type;
  set type(String? type) => _$this._type = type;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  JobDtoBuilder() {
    JobDto._defaults(this);
  }

  JobDtoBuilder get _$this {
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
  void replace(JobDto other) {
    _$v = other as _$JobDto;
  }

  @override
  void update(void Function(JobDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  JobDto build() => _build();

  _$JobDto _build() {
    _$JobDto _$result;
    try {
      _$result = _$v ??
          _$JobDto._(
            attempts: BuiltValueNullFieldError.checkNotNull(
              attempts,
              r'JobDto',
              'attempts',
            ),
            cancelledAt: cancelledAt,
            completedAt: completedAt,
            createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt,
              r'JobDto',
              'createdAt',
            ),
            createdById: createdById,
            errorMessage: errorMessage,
            id: BuiltValueNullFieldError.checkNotNull(id, r'JobDto', 'id'),
            maxAttempts: BuiltValueNullFieldError.checkNotNull(
              maxAttempts,
              r'JobDto',
              'maxAttempts',
            ),
            organizationId: organizationId,
            payload: payload.build(),
            priority: BuiltValueNullFieldError.checkNotNull(
              priority,
              r'JobDto',
              'priority',
            ),
            scheduledAt: BuiltValueNullFieldError.checkNotNull(
              scheduledAt,
              r'JobDto',
              'scheduledAt',
            ),
            startedAt: startedAt,
            status: BuiltValueNullFieldError.checkNotNull(
              status,
              r'JobDto',
              'status',
            ),
            type: BuiltValueNullFieldError.checkNotNull(
              type,
              r'JobDto',
              'type',
            ),
            updatedAt: BuiltValueNullFieldError.checkNotNull(
              updatedAt,
              r'JobDto',
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
          r'JobDto',
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
