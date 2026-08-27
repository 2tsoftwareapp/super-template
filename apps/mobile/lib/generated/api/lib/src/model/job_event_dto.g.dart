// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'job_event_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const JobEventDtoTypeEnum _$jobEventDtoTypeEnum_claimed =
    const JobEventDtoTypeEnum._('claimed');
const JobEventDtoTypeEnum _$jobEventDtoTypeEnum_completed =
    const JobEventDtoTypeEnum._('completed');
const JobEventDtoTypeEnum _$jobEventDtoTypeEnum_failed =
    const JobEventDtoTypeEnum._('failed');
const JobEventDtoTypeEnum _$jobEventDtoTypeEnum_retryScheduled =
    const JobEventDtoTypeEnum._('retryScheduled');
const JobEventDtoTypeEnum _$jobEventDtoTypeEnum_cancelled =
    const JobEventDtoTypeEnum._('cancelled');
const JobEventDtoTypeEnum _$jobEventDtoTypeEnum_noHandler =
    const JobEventDtoTypeEnum._('noHandler');

JobEventDtoTypeEnum _$jobEventDtoTypeEnumValueOf(String name) {
  switch (name) {
    case 'claimed':
      return _$jobEventDtoTypeEnum_claimed;
    case 'completed':
      return _$jobEventDtoTypeEnum_completed;
    case 'failed':
      return _$jobEventDtoTypeEnum_failed;
    case 'retryScheduled':
      return _$jobEventDtoTypeEnum_retryScheduled;
    case 'cancelled':
      return _$jobEventDtoTypeEnum_cancelled;
    case 'noHandler':
      return _$jobEventDtoTypeEnum_noHandler;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<JobEventDtoTypeEnum> _$jobEventDtoTypeEnumValues =
    BuiltSet<JobEventDtoTypeEnum>(const <JobEventDtoTypeEnum>[
  _$jobEventDtoTypeEnum_claimed,
  _$jobEventDtoTypeEnum_completed,
  _$jobEventDtoTypeEnum_failed,
  _$jobEventDtoTypeEnum_retryScheduled,
  _$jobEventDtoTypeEnum_cancelled,
  _$jobEventDtoTypeEnum_noHandler,
]);

Serializer<JobEventDtoTypeEnum> _$jobEventDtoTypeEnumSerializer =
    _$JobEventDtoTypeEnumSerializer();

class _$JobEventDtoTypeEnumSerializer
    implements PrimitiveSerializer<JobEventDtoTypeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'claimed': 'claimed',
    'completed': 'completed',
    'failed': 'failed',
    'retryScheduled': 'retry_scheduled',
    'cancelled': 'cancelled',
    'noHandler': 'no_handler',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'claimed': 'claimed',
    'completed': 'completed',
    'failed': 'failed',
    'retry_scheduled': 'retryScheduled',
    'cancelled': 'cancelled',
    'no_handler': 'noHandler',
  };

  @override
  final Iterable<Type> types = const <Type>[JobEventDtoTypeEnum];
  @override
  final String wireName = 'JobEventDtoTypeEnum';

  @override
  Object serialize(
    Serializers serializers,
    JobEventDtoTypeEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  JobEventDtoTypeEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      JobEventDtoTypeEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$JobEventDto extends JobEventDto {
  @override
  final String? attemptId;
  @override
  final String createdAt;
  @override
  final String id;
  @override
  final String jobId;
  @override
  final String? message;
  @override
  final BuiltMap<String, JsonObject?>? metadata;
  @override
  final JobEventDtoTypeEnum type;

  factory _$JobEventDto([void Function(JobEventDtoBuilder)? updates]) =>
      (JobEventDtoBuilder()..update(updates))._build();

  _$JobEventDto._({
    this.attemptId,
    required this.createdAt,
    required this.id,
    required this.jobId,
    this.message,
    this.metadata,
    required this.type,
  }) : super._();
  @override
  JobEventDto rebuild(void Function(JobEventDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  JobEventDtoBuilder toBuilder() => JobEventDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is JobEventDto &&
        attemptId == other.attemptId &&
        createdAt == other.createdAt &&
        id == other.id &&
        jobId == other.jobId &&
        message == other.message &&
        metadata == other.metadata &&
        type == other.type;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, attemptId.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, jobId.hashCode);
    _$hash = $jc(_$hash, message.hashCode);
    _$hash = $jc(_$hash, metadata.hashCode);
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'JobEventDto')
          ..add('attemptId', attemptId)
          ..add('createdAt', createdAt)
          ..add('id', id)
          ..add('jobId', jobId)
          ..add('message', message)
          ..add('metadata', metadata)
          ..add('type', type))
        .toString();
  }
}

class JobEventDtoBuilder implements Builder<JobEventDto, JobEventDtoBuilder> {
  _$JobEventDto? _$v;

  String? _attemptId;
  String? get attemptId => _$this._attemptId;
  set attemptId(String? attemptId) => _$this._attemptId = attemptId;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _jobId;
  String? get jobId => _$this._jobId;
  set jobId(String? jobId) => _$this._jobId = jobId;

  String? _message;
  String? get message => _$this._message;
  set message(String? message) => _$this._message = message;

  MapBuilder<String, JsonObject?>? _metadata;
  MapBuilder<String, JsonObject?> get metadata =>
      _$this._metadata ??= MapBuilder<String, JsonObject?>();
  set metadata(MapBuilder<String, JsonObject?>? metadata) =>
      _$this._metadata = metadata;

  JobEventDtoTypeEnum? _type;
  JobEventDtoTypeEnum? get type => _$this._type;
  set type(JobEventDtoTypeEnum? type) => _$this._type = type;

  JobEventDtoBuilder() {
    JobEventDto._defaults(this);
  }

  JobEventDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _attemptId = $v.attemptId;
      _createdAt = $v.createdAt;
      _id = $v.id;
      _jobId = $v.jobId;
      _message = $v.message;
      _metadata = $v.metadata?.toBuilder();
      _type = $v.type;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(JobEventDto other) {
    _$v = other as _$JobEventDto;
  }

  @override
  void update(void Function(JobEventDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  JobEventDto build() => _build();

  _$JobEventDto _build() {
    _$JobEventDto _$result;
    try {
      _$result = _$v ??
          _$JobEventDto._(
            attemptId: attemptId,
            createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt,
              r'JobEventDto',
              'createdAt',
            ),
            id: BuiltValueNullFieldError.checkNotNull(id, r'JobEventDto', 'id'),
            jobId: BuiltValueNullFieldError.checkNotNull(
              jobId,
              r'JobEventDto',
              'jobId',
            ),
            message: message,
            metadata: _metadata?.build(),
            type: BuiltValueNullFieldError.checkNotNull(
              type,
              r'JobEventDto',
              'type',
            ),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'metadata';
        _metadata?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'JobEventDto',
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
