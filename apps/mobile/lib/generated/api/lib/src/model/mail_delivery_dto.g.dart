// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'mail_delivery_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const MailDeliveryDtoStatusEnum _$mailDeliveryDtoStatusEnum_SENT =
    const MailDeliveryDtoStatusEnum._('SENT');
const MailDeliveryDtoStatusEnum _$mailDeliveryDtoStatusEnum_FAILED =
    const MailDeliveryDtoStatusEnum._('FAILED');

MailDeliveryDtoStatusEnum _$mailDeliveryDtoStatusEnumValueOf(String name) {
  switch (name) {
    case 'SENT':
      return _$mailDeliveryDtoStatusEnum_SENT;
    case 'FAILED':
      return _$mailDeliveryDtoStatusEnum_FAILED;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<MailDeliveryDtoStatusEnum> _$mailDeliveryDtoStatusEnumValues =
    BuiltSet<MailDeliveryDtoStatusEnum>(const <MailDeliveryDtoStatusEnum>[
  _$mailDeliveryDtoStatusEnum_SENT,
  _$mailDeliveryDtoStatusEnum_FAILED,
]);

Serializer<MailDeliveryDtoStatusEnum> _$mailDeliveryDtoStatusEnumSerializer =
    _$MailDeliveryDtoStatusEnumSerializer();

class _$MailDeliveryDtoStatusEnumSerializer
    implements PrimitiveSerializer<MailDeliveryDtoStatusEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'SENT': 'SENT',
    'FAILED': 'FAILED',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'SENT': 'SENT',
    'FAILED': 'FAILED',
  };

  @override
  final Iterable<Type> types = const <Type>[MailDeliveryDtoStatusEnum];
  @override
  final String wireName = 'MailDeliveryDtoStatusEnum';

  @override
  Object serialize(
    Serializers serializers,
    MailDeliveryDtoStatusEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  MailDeliveryDtoStatusEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      MailDeliveryDtoStatusEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$MailDeliveryDto extends MailDeliveryDto {
  @override
  final String id;
  @override
  final String templateKey;
  @override
  final String recipient;
  @override
  final String subject;
  @override
  final MailDeliveryDtoStatusEnum status;
  @override
  final JsonObject? errorMessage;
  @override
  final BuiltMap<String, JsonObject?>? metadata;
  @override
  final JsonObject? sentAt;
  @override
  final String createdAt;

  factory _$MailDeliveryDto([void Function(MailDeliveryDtoBuilder)? updates]) =>
      (MailDeliveryDtoBuilder()..update(updates))._build();

  _$MailDeliveryDto._({
    required this.id,
    required this.templateKey,
    required this.recipient,
    required this.subject,
    required this.status,
    this.errorMessage,
    this.metadata,
    this.sentAt,
    required this.createdAt,
  }) : super._();
  @override
  MailDeliveryDto rebuild(void Function(MailDeliveryDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MailDeliveryDtoBuilder toBuilder() => MailDeliveryDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MailDeliveryDto &&
        id == other.id &&
        templateKey == other.templateKey &&
        recipient == other.recipient &&
        subject == other.subject &&
        status == other.status &&
        errorMessage == other.errorMessage &&
        metadata == other.metadata &&
        sentAt == other.sentAt &&
        createdAt == other.createdAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, templateKey.hashCode);
    _$hash = $jc(_$hash, recipient.hashCode);
    _$hash = $jc(_$hash, subject.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, errorMessage.hashCode);
    _$hash = $jc(_$hash, metadata.hashCode);
    _$hash = $jc(_$hash, sentAt.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MailDeliveryDto')
          ..add('id', id)
          ..add('templateKey', templateKey)
          ..add('recipient', recipient)
          ..add('subject', subject)
          ..add('status', status)
          ..add('errorMessage', errorMessage)
          ..add('metadata', metadata)
          ..add('sentAt', sentAt)
          ..add('createdAt', createdAt))
        .toString();
  }
}

class MailDeliveryDtoBuilder
    implements Builder<MailDeliveryDto, MailDeliveryDtoBuilder> {
  _$MailDeliveryDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _templateKey;
  String? get templateKey => _$this._templateKey;
  set templateKey(String? templateKey) => _$this._templateKey = templateKey;

  String? _recipient;
  String? get recipient => _$this._recipient;
  set recipient(String? recipient) => _$this._recipient = recipient;

  String? _subject;
  String? get subject => _$this._subject;
  set subject(String? subject) => _$this._subject = subject;

  MailDeliveryDtoStatusEnum? _status;
  MailDeliveryDtoStatusEnum? get status => _$this._status;
  set status(MailDeliveryDtoStatusEnum? status) => _$this._status = status;

  JsonObject? _errorMessage;
  JsonObject? get errorMessage => _$this._errorMessage;
  set errorMessage(JsonObject? errorMessage) =>
      _$this._errorMessage = errorMessage;

  MapBuilder<String, JsonObject?>? _metadata;
  MapBuilder<String, JsonObject?> get metadata =>
      _$this._metadata ??= MapBuilder<String, JsonObject?>();
  set metadata(MapBuilder<String, JsonObject?>? metadata) =>
      _$this._metadata = metadata;

  JsonObject? _sentAt;
  JsonObject? get sentAt => _$this._sentAt;
  set sentAt(JsonObject? sentAt) => _$this._sentAt = sentAt;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  MailDeliveryDtoBuilder() {
    MailDeliveryDto._defaults(this);
  }

  MailDeliveryDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _templateKey = $v.templateKey;
      _recipient = $v.recipient;
      _subject = $v.subject;
      _status = $v.status;
      _errorMessage = $v.errorMessage;
      _metadata = $v.metadata?.toBuilder();
      _sentAt = $v.sentAt;
      _createdAt = $v.createdAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MailDeliveryDto other) {
    _$v = other as _$MailDeliveryDto;
  }

  @override
  void update(void Function(MailDeliveryDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MailDeliveryDto build() => _build();

  _$MailDeliveryDto _build() {
    _$MailDeliveryDto _$result;
    try {
      _$result = _$v ??
          _$MailDeliveryDto._(
            id: BuiltValueNullFieldError.checkNotNull(
              id,
              r'MailDeliveryDto',
              'id',
            ),
            templateKey: BuiltValueNullFieldError.checkNotNull(
              templateKey,
              r'MailDeliveryDto',
              'templateKey',
            ),
            recipient: BuiltValueNullFieldError.checkNotNull(
              recipient,
              r'MailDeliveryDto',
              'recipient',
            ),
            subject: BuiltValueNullFieldError.checkNotNull(
              subject,
              r'MailDeliveryDto',
              'subject',
            ),
            status: BuiltValueNullFieldError.checkNotNull(
              status,
              r'MailDeliveryDto',
              'status',
            ),
            errorMessage: errorMessage,
            metadata: _metadata?.build(),
            sentAt: sentAt,
            createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt,
              r'MailDeliveryDto',
              'createdAt',
            ),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'metadata';
        _metadata?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'MailDeliveryDto',
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
