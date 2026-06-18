// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'device_token_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const DeviceTokenDtoPlatformEnum _$deviceTokenDtoPlatformEnum_IOS =
    const DeviceTokenDtoPlatformEnum._('IOS');
const DeviceTokenDtoPlatformEnum _$deviceTokenDtoPlatformEnum_ANDROID =
    const DeviceTokenDtoPlatformEnum._('ANDROID');

DeviceTokenDtoPlatformEnum _$deviceTokenDtoPlatformEnumValueOf(String name) {
  switch (name) {
    case 'IOS':
      return _$deviceTokenDtoPlatformEnum_IOS;
    case 'ANDROID':
      return _$deviceTokenDtoPlatformEnum_ANDROID;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<DeviceTokenDtoPlatformEnum> _$deviceTokenDtoPlatformEnumValues =
    BuiltSet<DeviceTokenDtoPlatformEnum>(const <DeviceTokenDtoPlatformEnum>[
  _$deviceTokenDtoPlatformEnum_IOS,
  _$deviceTokenDtoPlatformEnum_ANDROID,
]);

Serializer<DeviceTokenDtoPlatformEnum> _$deviceTokenDtoPlatformEnumSerializer =
    _$DeviceTokenDtoPlatformEnumSerializer();

class _$DeviceTokenDtoPlatformEnumSerializer
    implements PrimitiveSerializer<DeviceTokenDtoPlatformEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'IOS': 'IOS',
    'ANDROID': 'ANDROID',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'IOS': 'IOS',
    'ANDROID': 'ANDROID',
  };

  @override
  final Iterable<Type> types = const <Type>[DeviceTokenDtoPlatformEnum];
  @override
  final String wireName = 'DeviceTokenDtoPlatformEnum';

  @override
  Object serialize(
    Serializers serializers,
    DeviceTokenDtoPlatformEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  DeviceTokenDtoPlatformEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      DeviceTokenDtoPlatformEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$DeviceTokenDto extends DeviceTokenDto {
  @override
  final String id;
  @override
  final DeviceTokenDtoPlatformEnum platform;
  @override
  final String token;
  @override
  final String lastUsedAt;

  factory _$DeviceTokenDto([void Function(DeviceTokenDtoBuilder)? updates]) =>
      (DeviceTokenDtoBuilder()..update(updates))._build();

  _$DeviceTokenDto._({
    required this.id,
    required this.platform,
    required this.token,
    required this.lastUsedAt,
  }) : super._();
  @override
  DeviceTokenDto rebuild(void Function(DeviceTokenDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DeviceTokenDtoBuilder toBuilder() => DeviceTokenDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DeviceTokenDto &&
        id == other.id &&
        platform == other.platform &&
        token == other.token &&
        lastUsedAt == other.lastUsedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, platform.hashCode);
    _$hash = $jc(_$hash, token.hashCode);
    _$hash = $jc(_$hash, lastUsedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DeviceTokenDto')
          ..add('id', id)
          ..add('platform', platform)
          ..add('token', token)
          ..add('lastUsedAt', lastUsedAt))
        .toString();
  }
}

class DeviceTokenDtoBuilder
    implements Builder<DeviceTokenDto, DeviceTokenDtoBuilder> {
  _$DeviceTokenDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  DeviceTokenDtoPlatformEnum? _platform;
  DeviceTokenDtoPlatformEnum? get platform => _$this._platform;
  set platform(DeviceTokenDtoPlatformEnum? platform) =>
      _$this._platform = platform;

  String? _token;
  String? get token => _$this._token;
  set token(String? token) => _$this._token = token;

  String? _lastUsedAt;
  String? get lastUsedAt => _$this._lastUsedAt;
  set lastUsedAt(String? lastUsedAt) => _$this._lastUsedAt = lastUsedAt;

  DeviceTokenDtoBuilder() {
    DeviceTokenDto._defaults(this);
  }

  DeviceTokenDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _platform = $v.platform;
      _token = $v.token;
      _lastUsedAt = $v.lastUsedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DeviceTokenDto other) {
    _$v = other as _$DeviceTokenDto;
  }

  @override
  void update(void Function(DeviceTokenDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DeviceTokenDto build() => _build();

  _$DeviceTokenDto _build() {
    final _$result = _$v ??
        _$DeviceTokenDto._(
          id: BuiltValueNullFieldError.checkNotNull(
            id,
            r'DeviceTokenDto',
            'id',
          ),
          platform: BuiltValueNullFieldError.checkNotNull(
            platform,
            r'DeviceTokenDto',
            'platform',
          ),
          token: BuiltValueNullFieldError.checkNotNull(
            token,
            r'DeviceTokenDto',
            'token',
          ),
          lastUsedAt: BuiltValueNullFieldError.checkNotNull(
            lastUsedAt,
            r'DeviceTokenDto',
            'lastUsedAt',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
