// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'job_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const JobDtoStatusEnum _$jobDtoStatusEnum_PENDING =
    const JobDtoStatusEnum._('PENDING');
const JobDtoStatusEnum _$jobDtoStatusEnum_PROCESSING =
    const JobDtoStatusEnum._('PROCESSING');
const JobDtoStatusEnum _$jobDtoStatusEnum_COMPLETED =
    const JobDtoStatusEnum._('COMPLETED');
const JobDtoStatusEnum _$jobDtoStatusEnum_CANCELLED =
    const JobDtoStatusEnum._('CANCELLED');
const JobDtoStatusEnum _$jobDtoStatusEnum_FAILED =
    const JobDtoStatusEnum._('FAILED');

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
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'PENDING': 'PENDING',
    'PROCESSING': 'PROCESSING',
    'COMPLETED': 'COMPLETED',
    'CANCELLED': 'CANCELLED',
    'FAILED': 'FAILED',
  };

  @override
  final Iterable<Type> types = const <Type>[JobDtoStatusEnum];
  @override
  final String wireName = 'JobDtoStatusEnum';

  @override
  Object serialize(Serializers serializers, JobDtoStatusEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  JobDtoStatusEnum deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      JobDtoStatusEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$JobDto extends JobDto {
  @override
  final String id;
  @override
  final String type;
  @override
  final BuiltMap<String, JsonObject?> payload;
  @override
  final JobDtoStatusEnum status;
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

  factory _$JobDto([void Function(JobDtoBuilder)? updates]) =>
      (JobDtoBuilder()..update(updates))._build();

  _$JobDto._(
      {required this.id,
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
      required this.updatedAt})
      : super._();
  @override
  JobDto rebuild(void Function(JobDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  JobDtoBuilder toBuilder() => JobDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is JobDto &&
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
        updatedAt == other.updatedAt;
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
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'JobDto')
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
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class JobDtoBuilder implements Builder<JobDto, JobDtoBuilder> {
  _$JobDto? _$v;

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

  JobDtoStatusEnum? _status;
  JobDtoStatusEnum? get status => _$this._status;
  set status(JobDtoStatusEnum? status) => _$this._status = status;

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

  JobDtoBuilder() {
    JobDto._defaults(this);
  }

  JobDtoBuilder get _$this {
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
            id: BuiltValueNullFieldError.checkNotNull(id, r'JobDto', 'id'),
            type:
                BuiltValueNullFieldError.checkNotNull(type, r'JobDto', 'type'),
            payload: payload.build(),
            status: BuiltValueNullFieldError.checkNotNull(
                status, r'JobDto', 'status'),
            scheduledAt: BuiltValueNullFieldError.checkNotNull(
                scheduledAt, r'JobDto', 'scheduledAt'),
            priority: BuiltValueNullFieldError.checkNotNull(
                priority, r'JobDto', 'priority'),
            attempts: BuiltValueNullFieldError.checkNotNull(
                attempts, r'JobDto', 'attempts'),
            maxAttempts: BuiltValueNullFieldError.checkNotNull(
                maxAttempts, r'JobDto', 'maxAttempts'),
            startedAt: startedAt,
            completedAt: completedAt,
            cancelledAt: cancelledAt,
            errorMessage: errorMessage,
            createdById: createdById,
            createdAt: BuiltValueNullFieldError.checkNotNull(
                createdAt, r'JobDto', 'createdAt'),
            updatedAt: BuiltValueNullFieldError.checkNotNull(
                updatedAt, r'JobDto', 'updatedAt'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'payload';
        payload.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'JobDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
