// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'health_status_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const HealthStatusDtoStatusEnum _$healthStatusDtoStatusEnum_ok =
    const HealthStatusDtoStatusEnum._('ok');
const HealthStatusDtoStatusEnum _$healthStatusDtoStatusEnum_ready =
    const HealthStatusDtoStatusEnum._('ready');

HealthStatusDtoStatusEnum _$healthStatusDtoStatusEnumValueOf(String name) {
  switch (name) {
    case 'ok':
      return _$healthStatusDtoStatusEnum_ok;
    case 'ready':
      return _$healthStatusDtoStatusEnum_ready;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<HealthStatusDtoStatusEnum> _$healthStatusDtoStatusEnumValues =
    BuiltSet<HealthStatusDtoStatusEnum>(const <HealthStatusDtoStatusEnum>[
  _$healthStatusDtoStatusEnum_ok,
  _$healthStatusDtoStatusEnum_ready,
]);

Serializer<HealthStatusDtoStatusEnum> _$healthStatusDtoStatusEnumSerializer =
    _$HealthStatusDtoStatusEnumSerializer();

class _$HealthStatusDtoStatusEnumSerializer
    implements PrimitiveSerializer<HealthStatusDtoStatusEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'ok': 'ok',
    'ready': 'ready',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'ok': 'ok',
    'ready': 'ready',
  };

  @override
  final Iterable<Type> types = const <Type>[HealthStatusDtoStatusEnum];
  @override
  final String wireName = 'HealthStatusDtoStatusEnum';

  @override
  Object serialize(Serializers serializers, HealthStatusDtoStatusEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  HealthStatusDtoStatusEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      HealthStatusDtoStatusEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$HealthStatusDto extends HealthStatusDto {
  @override
  final HealthStatusDtoStatusEnum status;

  factory _$HealthStatusDto([void Function(HealthStatusDtoBuilder)? updates]) =>
      (HealthStatusDtoBuilder()..update(updates))._build();

  _$HealthStatusDto._({required this.status}) : super._();
  @override
  HealthStatusDto rebuild(void Function(HealthStatusDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  HealthStatusDtoBuilder toBuilder() => HealthStatusDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is HealthStatusDto && status == other.status;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'HealthStatusDto')
          ..add('status', status))
        .toString();
  }
}

class HealthStatusDtoBuilder
    implements Builder<HealthStatusDto, HealthStatusDtoBuilder> {
  _$HealthStatusDto? _$v;

  HealthStatusDtoStatusEnum? _status;
  HealthStatusDtoStatusEnum? get status => _$this._status;
  set status(HealthStatusDtoStatusEnum? status) => _$this._status = status;

  HealthStatusDtoBuilder() {
    HealthStatusDto._defaults(this);
  }

  HealthStatusDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _status = $v.status;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(HealthStatusDto other) {
    _$v = other as _$HealthStatusDto;
  }

  @override
  void update(void Function(HealthStatusDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  HealthStatusDto build() => _build();

  _$HealthStatusDto _build() {
    final _$result = _$v ??
        _$HealthStatusDto._(
          status: BuiltValueNullFieldError.checkNotNull(
              status, r'HealthStatusDto', 'status'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
