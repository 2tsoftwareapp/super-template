// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'request_meta_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RequestMetaDto extends RequestMetaDto {
  @override
  final String requestId;

  factory _$RequestMetaDto([void Function(RequestMetaDtoBuilder)? updates]) =>
      (RequestMetaDtoBuilder()..update(updates))._build();

  _$RequestMetaDto._({required this.requestId}) : super._();
  @override
  RequestMetaDto rebuild(void Function(RequestMetaDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  RequestMetaDtoBuilder toBuilder() => RequestMetaDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RequestMetaDto && requestId == other.requestId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, requestId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'RequestMetaDto',
    )..add('requestId', requestId))
        .toString();
  }
}

class RequestMetaDtoBuilder
    implements Builder<RequestMetaDto, RequestMetaDtoBuilder> {
  _$RequestMetaDto? _$v;

  String? _requestId;
  String? get requestId => _$this._requestId;
  set requestId(String? requestId) => _$this._requestId = requestId;

  RequestMetaDtoBuilder() {
    RequestMetaDto._defaults(this);
  }

  RequestMetaDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _requestId = $v.requestId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RequestMetaDto other) {
    _$v = other as _$RequestMetaDto;
  }

  @override
  void update(void Function(RequestMetaDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RequestMetaDto build() => _build();

  _$RequestMetaDto _build() {
    final _$result = _$v ??
        _$RequestMetaDto._(
          requestId: BuiltValueNullFieldError.checkNotNull(
            requestId,
            r'RequestMetaDto',
            'requestId',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
