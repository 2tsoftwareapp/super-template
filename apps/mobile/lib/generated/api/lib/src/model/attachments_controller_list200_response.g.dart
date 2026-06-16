// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'attachments_controller_list200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AttachmentsControllerList200Response
    extends AttachmentsControllerList200Response {
  @override
  final BuiltList<AttachmentDto> data;
  @override
  final RequestMetaDto meta;

  factory _$AttachmentsControllerList200Response(
          [void Function(AttachmentsControllerList200ResponseBuilder)?
              updates]) =>
      (AttachmentsControllerList200ResponseBuilder()..update(updates))._build();

  _$AttachmentsControllerList200Response._(
      {required this.data, required this.meta})
      : super._();
  @override
  AttachmentsControllerList200Response rebuild(
          void Function(AttachmentsControllerList200ResponseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AttachmentsControllerList200ResponseBuilder toBuilder() =>
      AttachmentsControllerList200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AttachmentsControllerList200Response &&
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
    return (newBuiltValueToStringHelper(r'AttachmentsControllerList200Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AttachmentsControllerList200ResponseBuilder
    implements
        Builder<AttachmentsControllerList200Response,
            AttachmentsControllerList200ResponseBuilder> {
  _$AttachmentsControllerList200Response? _$v;

  ListBuilder<AttachmentDto>? _data;
  ListBuilder<AttachmentDto> get data =>
      _$this._data ??= ListBuilder<AttachmentDto>();
  set data(ListBuilder<AttachmentDto>? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AttachmentsControllerList200ResponseBuilder() {
    AttachmentsControllerList200Response._defaults(this);
  }

  AttachmentsControllerList200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AttachmentsControllerList200Response other) {
    _$v = other as _$AttachmentsControllerList200Response;
  }

  @override
  void update(
      void Function(AttachmentsControllerList200ResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AttachmentsControllerList200Response build() => _build();

  _$AttachmentsControllerList200Response _build() {
    _$AttachmentsControllerList200Response _$result;
    try {
      _$result = _$v ??
          _$AttachmentsControllerList200Response._(
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
            r'AttachmentsControllerList200Response',
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
