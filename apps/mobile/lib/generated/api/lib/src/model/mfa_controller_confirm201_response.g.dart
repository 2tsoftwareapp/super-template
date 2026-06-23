// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'mfa_controller_confirm201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MfaControllerConfirm201Response
    extends MfaControllerConfirm201Response {
  @override
  final MfaRecoveryCodesResponseDto data;
  @override
  final RequestMetaDto meta;

  factory _$MfaControllerConfirm201Response([
    void Function(MfaControllerConfirm201ResponseBuilder)? updates,
  ]) =>
      (MfaControllerConfirm201ResponseBuilder()..update(updates))._build();

  _$MfaControllerConfirm201Response._({required this.data, required this.meta})
      : super._();
  @override
  MfaControllerConfirm201Response rebuild(
    void Function(MfaControllerConfirm201ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  MfaControllerConfirm201ResponseBuilder toBuilder() =>
      MfaControllerConfirm201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MfaControllerConfirm201Response &&
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
    return (newBuiltValueToStringHelper(r'MfaControllerConfirm201Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class MfaControllerConfirm201ResponseBuilder
    implements
        Builder<MfaControllerConfirm201Response,
            MfaControllerConfirm201ResponseBuilder> {
  _$MfaControllerConfirm201Response? _$v;

  MfaRecoveryCodesResponseDtoBuilder? _data;
  MfaRecoveryCodesResponseDtoBuilder get data =>
      _$this._data ??= MfaRecoveryCodesResponseDtoBuilder();
  set data(MfaRecoveryCodesResponseDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  MfaControllerConfirm201ResponseBuilder() {
    MfaControllerConfirm201Response._defaults(this);
  }

  MfaControllerConfirm201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MfaControllerConfirm201Response other) {
    _$v = other as _$MfaControllerConfirm201Response;
  }

  @override
  void update(void Function(MfaControllerConfirm201ResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MfaControllerConfirm201Response build() => _build();

  _$MfaControllerConfirm201Response _build() {
    _$MfaControllerConfirm201Response _$result;
    try {
      _$result = _$v ??
          _$MfaControllerConfirm201Response._(
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
          r'MfaControllerConfirm201Response',
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
