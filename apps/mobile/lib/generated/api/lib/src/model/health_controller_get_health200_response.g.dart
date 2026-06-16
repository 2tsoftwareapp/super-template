// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'health_controller_get_health200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$HealthControllerGetHealth200Response
    extends HealthControllerGetHealth200Response {
  @override
  final HealthStatusDto data;
  @override
  final RequestMetaDto meta;

  factory _$HealthControllerGetHealth200Response(
          [void Function(HealthControllerGetHealth200ResponseBuilder)?
              updates]) =>
      (HealthControllerGetHealth200ResponseBuilder()..update(updates))._build();

  _$HealthControllerGetHealth200Response._(
      {required this.data, required this.meta})
      : super._();
  @override
  HealthControllerGetHealth200Response rebuild(
          void Function(HealthControllerGetHealth200ResponseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  HealthControllerGetHealth200ResponseBuilder toBuilder() =>
      HealthControllerGetHealth200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is HealthControllerGetHealth200Response &&
        data == other.data &&
        meta == other.meta;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, data.hashCode);
    _$hash = $jc(_$hash, meta.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'HealthControllerGetHealth200Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class HealthControllerGetHealth200ResponseBuilder
    implements
        Builder<HealthControllerGetHealth200Response,
            HealthControllerGetHealth200ResponseBuilder> {
  _$HealthControllerGetHealth200Response? _$v;

  HealthStatusDtoBuilder? _data;
  HealthStatusDtoBuilder get data => _$this._data ??= HealthStatusDtoBuilder();
  set data(HealthStatusDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  HealthControllerGetHealth200ResponseBuilder() {
    HealthControllerGetHealth200Response._defaults(this);
  }

  HealthControllerGetHealth200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(HealthControllerGetHealth200Response other) {
    _$v = other as _$HealthControllerGetHealth200Response;
  }

  @override
  void update(
      void Function(HealthControllerGetHealth200ResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  HealthControllerGetHealth200Response build() => _build();

  _$HealthControllerGetHealth200Response _build() {
    _$HealthControllerGetHealth200Response _$result;
    try {
      _$result = _$v ??
          _$HealthControllerGetHealth200Response._(
            data: data.build(),
            meta: meta.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
        _$failedField = 'meta';
        meta.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'HealthControllerGetHealth200Response',
            _$failedField,
            e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
