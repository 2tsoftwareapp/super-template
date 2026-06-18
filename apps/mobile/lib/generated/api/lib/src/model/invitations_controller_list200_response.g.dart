// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'invitations_controller_list200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$InvitationsControllerList200Response
    extends InvitationsControllerList200Response {
  @override
  final BuiltList<InvitationDto> data;
  @override
  final PaginationMetaDto meta;

  factory _$InvitationsControllerList200Response([
    void Function(InvitationsControllerList200ResponseBuilder)? updates,
  ]) =>
      (InvitationsControllerList200ResponseBuilder()..update(updates))._build();

  _$InvitationsControllerList200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  InvitationsControllerList200Response rebuild(
    void Function(InvitationsControllerList200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  InvitationsControllerList200ResponseBuilder toBuilder() =>
      InvitationsControllerList200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is InvitationsControllerList200Response &&
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
    return (newBuiltValueToStringHelper(r'InvitationsControllerList200Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class InvitationsControllerList200ResponseBuilder
    implements
        Builder<InvitationsControllerList200Response,
            InvitationsControllerList200ResponseBuilder> {
  _$InvitationsControllerList200Response? _$v;

  ListBuilder<InvitationDto>? _data;
  ListBuilder<InvitationDto> get data =>
      _$this._data ??= ListBuilder<InvitationDto>();
  set data(ListBuilder<InvitationDto>? data) => _$this._data = data;

  PaginationMetaDtoBuilder? _meta;
  PaginationMetaDtoBuilder get meta =>
      _$this._meta ??= PaginationMetaDtoBuilder();
  set meta(PaginationMetaDtoBuilder? meta) => _$this._meta = meta;

  InvitationsControllerList200ResponseBuilder() {
    InvitationsControllerList200Response._defaults(this);
  }

  InvitationsControllerList200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(InvitationsControllerList200Response other) {
    _$v = other as _$InvitationsControllerList200Response;
  }

  @override
  void update(
    void Function(InvitationsControllerList200ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  InvitationsControllerList200Response build() => _build();

  _$InvitationsControllerList200Response _build() {
    _$InvitationsControllerList200Response _$result;
    try {
      _$result = _$v ??
          _$InvitationsControllerList200Response._(
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
          r'InvitationsControllerList200Response',
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
