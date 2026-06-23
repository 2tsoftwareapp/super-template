// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'mfa_controller_get_status200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MfaControllerGetStatus200Response
    extends MfaControllerGetStatus200Response {
  @override
  final MfaStatusDto data;
  @override
  final RequestMetaDto meta;

  factory _$MfaControllerGetStatus200Response([
    void Function(MfaControllerGetStatus200ResponseBuilder)? updates,
  ]) =>
      (MfaControllerGetStatus200ResponseBuilder()..update(updates))._build();

  _$MfaControllerGetStatus200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  MfaControllerGetStatus200Response rebuild(
    void Function(MfaControllerGetStatus200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  MfaControllerGetStatus200ResponseBuilder toBuilder() =>
      MfaControllerGetStatus200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MfaControllerGetStatus200Response &&
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
    return (newBuiltValueToStringHelper(r'MfaControllerGetStatus200Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class MfaControllerGetStatus200ResponseBuilder
    implements
        Builder<MfaControllerGetStatus200Response,
            MfaControllerGetStatus200ResponseBuilder> {
  _$MfaControllerGetStatus200Response? _$v;

  MfaStatusDtoBuilder? _data;
  MfaStatusDtoBuilder get data => _$this._data ??= MfaStatusDtoBuilder();
  set data(MfaStatusDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  MfaControllerGetStatus200ResponseBuilder() {
    MfaControllerGetStatus200Response._defaults(this);
  }

  MfaControllerGetStatus200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MfaControllerGetStatus200Response other) {
    _$v = other as _$MfaControllerGetStatus200Response;
  }

  @override
  void update(
    void Function(MfaControllerGetStatus200ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  MfaControllerGetStatus200Response build() => _build();

  _$MfaControllerGetStatus200Response _build() {
    _$MfaControllerGetStatus200Response _$result;
    try {
      _$result = _$v ??
          _$MfaControllerGetStatus200Response._(
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
          r'MfaControllerGetStatus200Response',
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
