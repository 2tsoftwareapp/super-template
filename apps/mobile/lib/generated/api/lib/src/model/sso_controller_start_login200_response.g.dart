// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'sso_controller_start_login200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SsoControllerStartLogin200Response
    extends SsoControllerStartLogin200Response {
  @override
  final StartSsoLoginResponseDto data;
  @override
  final RequestMetaDto meta;

  factory _$SsoControllerStartLogin200Response([
    void Function(SsoControllerStartLogin200ResponseBuilder)? updates,
  ]) =>
      (SsoControllerStartLogin200ResponseBuilder()..update(updates))._build();

  _$SsoControllerStartLogin200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  SsoControllerStartLogin200Response rebuild(
    void Function(SsoControllerStartLogin200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  SsoControllerStartLogin200ResponseBuilder toBuilder() =>
      SsoControllerStartLogin200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SsoControllerStartLogin200Response &&
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
    return (newBuiltValueToStringHelper(r'SsoControllerStartLogin200Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class SsoControllerStartLogin200ResponseBuilder
    implements
        Builder<SsoControllerStartLogin200Response,
            SsoControllerStartLogin200ResponseBuilder> {
  _$SsoControllerStartLogin200Response? _$v;

  StartSsoLoginResponseDtoBuilder? _data;
  StartSsoLoginResponseDtoBuilder get data =>
      _$this._data ??= StartSsoLoginResponseDtoBuilder();
  set data(StartSsoLoginResponseDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  SsoControllerStartLogin200ResponseBuilder() {
    SsoControllerStartLogin200Response._defaults(this);
  }

  SsoControllerStartLogin200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SsoControllerStartLogin200Response other) {
    _$v = other as _$SsoControllerStartLogin200Response;
  }

  @override
  void update(
    void Function(SsoControllerStartLogin200ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  SsoControllerStartLogin200Response build() => _build();

  _$SsoControllerStartLogin200Response _build() {
    _$SsoControllerStartLogin200Response _$result;
    try {
      _$result = _$v ??
          _$SsoControllerStartLogin200Response._(
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
          r'SsoControllerStartLogin200Response',
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
