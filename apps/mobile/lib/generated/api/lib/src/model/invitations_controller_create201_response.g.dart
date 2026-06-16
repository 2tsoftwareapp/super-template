// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'invitations_controller_create201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$InvitationsControllerCreate201Response
    extends InvitationsControllerCreate201Response {
  @override
  final InvitationDto data;
  @override
  final RequestMetaDto meta;

  factory _$InvitationsControllerCreate201Response(
          [void Function(InvitationsControllerCreate201ResponseBuilder)?
              updates]) =>
      (InvitationsControllerCreate201ResponseBuilder()..update(updates))
          ._build();

  _$InvitationsControllerCreate201Response._(
      {required this.data, required this.meta})
      : super._();
  @override
  InvitationsControllerCreate201Response rebuild(
          void Function(InvitationsControllerCreate201ResponseBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  InvitationsControllerCreate201ResponseBuilder toBuilder() =>
      InvitationsControllerCreate201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is InvitationsControllerCreate201Response &&
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
    return (newBuiltValueToStringHelper(
            r'InvitationsControllerCreate201Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class InvitationsControllerCreate201ResponseBuilder
    implements
        Builder<InvitationsControllerCreate201Response,
            InvitationsControllerCreate201ResponseBuilder> {
  _$InvitationsControllerCreate201Response? _$v;

  InvitationDtoBuilder? _data;
  InvitationDtoBuilder get data => _$this._data ??= InvitationDtoBuilder();
  set data(InvitationDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  InvitationsControllerCreate201ResponseBuilder() {
    InvitationsControllerCreate201Response._defaults(this);
  }

  InvitationsControllerCreate201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(InvitationsControllerCreate201Response other) {
    _$v = other as _$InvitationsControllerCreate201Response;
  }

  @override
  void update(
      void Function(InvitationsControllerCreate201ResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  InvitationsControllerCreate201Response build() => _build();

  _$InvitationsControllerCreate201Response _build() {
    _$InvitationsControllerCreate201Response _$result;
    try {
      _$result = _$v ??
          _$InvitationsControllerCreate201Response._(
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
            r'InvitationsControllerCreate201Response',
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
