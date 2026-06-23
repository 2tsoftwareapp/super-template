// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'send_admin_mail_result_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const SendAdminMailResultDtoStatusEnum
    _$sendAdminMailResultDtoStatusEnum_PENDING =
    const SendAdminMailResultDtoStatusEnum._('PENDING');
const SendAdminMailResultDtoStatusEnum
    _$sendAdminMailResultDtoStatusEnum_PROCESSING =
    const SendAdminMailResultDtoStatusEnum._('PROCESSING');
const SendAdminMailResultDtoStatusEnum
    _$sendAdminMailResultDtoStatusEnum_COMPLETED =
    const SendAdminMailResultDtoStatusEnum._('COMPLETED');
const SendAdminMailResultDtoStatusEnum
    _$sendAdminMailResultDtoStatusEnum_CANCELLED =
    const SendAdminMailResultDtoStatusEnum._('CANCELLED');
const SendAdminMailResultDtoStatusEnum
    _$sendAdminMailResultDtoStatusEnum_FAILED =
    const SendAdminMailResultDtoStatusEnum._('FAILED');

SendAdminMailResultDtoStatusEnum _$sendAdminMailResultDtoStatusEnumValueOf(
  String name,
) {
  switch (name) {
    case 'PENDING':
      return _$sendAdminMailResultDtoStatusEnum_PENDING;
    case 'PROCESSING':
      return _$sendAdminMailResultDtoStatusEnum_PROCESSING;
    case 'COMPLETED':
      return _$sendAdminMailResultDtoStatusEnum_COMPLETED;
    case 'CANCELLED':
      return _$sendAdminMailResultDtoStatusEnum_CANCELLED;
    case 'FAILED':
      return _$sendAdminMailResultDtoStatusEnum_FAILED;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<SendAdminMailResultDtoStatusEnum>
    _$sendAdminMailResultDtoStatusEnumValues =
    BuiltSet<SendAdminMailResultDtoStatusEnum>(
  const <SendAdminMailResultDtoStatusEnum>[
    _$sendAdminMailResultDtoStatusEnum_PENDING,
    _$sendAdminMailResultDtoStatusEnum_PROCESSING,
    _$sendAdminMailResultDtoStatusEnum_COMPLETED,
    _$sendAdminMailResultDtoStatusEnum_CANCELLED,
    _$sendAdminMailResultDtoStatusEnum_FAILED,
  ],
);

Serializer<SendAdminMailResultDtoStatusEnum>
    _$sendAdminMailResultDtoStatusEnumSerializer =
    _$SendAdminMailResultDtoStatusEnumSerializer();

class _$SendAdminMailResultDtoStatusEnumSerializer
    implements PrimitiveSerializer<SendAdminMailResultDtoStatusEnum> {
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
  final Iterable<Type> types = const <Type>[SendAdminMailResultDtoStatusEnum];
  @override
  final String wireName = 'SendAdminMailResultDtoStatusEnum';

  @override
  Object serialize(
    Serializers serializers,
    SendAdminMailResultDtoStatusEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  SendAdminMailResultDtoStatusEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      SendAdminMailResultDtoStatusEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$SendAdminMailResultDto extends SendAdminMailResultDto {
  @override
  final String jobId;
  @override
  final SendAdminMailResultDtoStatusEnum status;

  factory _$SendAdminMailResultDto([
    void Function(SendAdminMailResultDtoBuilder)? updates,
  ]) =>
      (SendAdminMailResultDtoBuilder()..update(updates))._build();

  _$SendAdminMailResultDto._({required this.jobId, required this.status})
      : super._();
  @override
  SendAdminMailResultDto rebuild(
    void Function(SendAdminMailResultDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  SendAdminMailResultDtoBuilder toBuilder() =>
      SendAdminMailResultDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SendAdminMailResultDto &&
        jobId == other.jobId &&
        status == other.status;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, jobId.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SendAdminMailResultDto')
          ..add('jobId', jobId)
          ..add('status', status))
        .toString();
  }
}

class SendAdminMailResultDtoBuilder
    implements Builder<SendAdminMailResultDto, SendAdminMailResultDtoBuilder> {
  _$SendAdminMailResultDto? _$v;

  String? _jobId;
  String? get jobId => _$this._jobId;
  set jobId(String? jobId) => _$this._jobId = jobId;

  SendAdminMailResultDtoStatusEnum? _status;
  SendAdminMailResultDtoStatusEnum? get status => _$this._status;
  set status(SendAdminMailResultDtoStatusEnum? status) =>
      _$this._status = status;

  SendAdminMailResultDtoBuilder() {
    SendAdminMailResultDto._defaults(this);
  }

  SendAdminMailResultDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _jobId = $v.jobId;
      _status = $v.status;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SendAdminMailResultDto other) {
    _$v = other as _$SendAdminMailResultDto;
  }

  @override
  void update(void Function(SendAdminMailResultDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SendAdminMailResultDto build() => _build();

  _$SendAdminMailResultDto _build() {
    final _$result = _$v ??
        _$SendAdminMailResultDto._(
          jobId: BuiltValueNullFieldError.checkNotNull(
            jobId,
            r'SendAdminMailResultDto',
            'jobId',
          ),
          status: BuiltValueNullFieldError.checkNotNull(
            status,
            r'SendAdminMailResultDto',
            'status',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
