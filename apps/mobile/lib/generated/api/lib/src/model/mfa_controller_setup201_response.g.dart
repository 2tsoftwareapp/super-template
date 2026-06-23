// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'mfa_controller_setup201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MfaControllerSetup201Response extends MfaControllerSetup201Response {
  @override
  final MfaSetupResponseDto data;
  @override
  final RequestMetaDto meta;

  factory _$MfaControllerSetup201Response([
    void Function(MfaControllerSetup201ResponseBuilder)? updates,
  ]) =>
      (MfaControllerSetup201ResponseBuilder()..update(updates))._build();

  _$MfaControllerSetup201Response._({required this.data, required this.meta})
      : super._();
  @override
  MfaControllerSetup201Response rebuild(
    void Function(MfaControllerSetup201ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  MfaControllerSetup201ResponseBuilder toBuilder() =>
      MfaControllerSetup201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MfaControllerSetup201Response &&
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
    return (newBuiltValueToStringHelper(r'MfaControllerSetup201Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class MfaControllerSetup201ResponseBuilder
    implements
        Builder<MfaControllerSetup201Response,
            MfaControllerSetup201ResponseBuilder> {
  _$MfaControllerSetup201Response? _$v;

  MfaSetupResponseDtoBuilder? _data;
  MfaSetupResponseDtoBuilder get data =>
      _$this._data ??= MfaSetupResponseDtoBuilder();
  set data(MfaSetupResponseDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  MfaControllerSetup201ResponseBuilder() {
    MfaControllerSetup201Response._defaults(this);
  }

  MfaControllerSetup201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MfaControllerSetup201Response other) {
    _$v = other as _$MfaControllerSetup201Response;
  }

  @override
  void update(void Function(MfaControllerSetup201ResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MfaControllerSetup201Response build() => _build();

  _$MfaControllerSetup201Response _build() {
    _$MfaControllerSetup201Response _$result;
    try {
      _$result = _$v ??
          _$MfaControllerSetup201Response._(
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
          r'MfaControllerSetup201Response',
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
