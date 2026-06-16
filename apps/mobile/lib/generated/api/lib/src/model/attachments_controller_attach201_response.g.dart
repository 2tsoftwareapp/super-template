// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'attachments_controller_attach201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AttachmentsControllerAttach201Response
    extends AttachmentsControllerAttach201Response {
  @override
  final AttachmentDto data;
  @override
  final RequestMetaDto meta;

  factory _$AttachmentsControllerAttach201Response(
          [void Function(AttachmentsControllerAttach201ResponseBuilder)?
              updates]) =>
      (AttachmentsControllerAttach201ResponseBuilder()..update(updates))
          ._build();

  _$AttachmentsControllerAttach201Response._(
      {required this.data, required this.meta})
      : super._();
  @override
  AttachmentsControllerAttach201Response rebuild(
          void Function(AttachmentsControllerAttach201ResponseBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AttachmentsControllerAttach201ResponseBuilder toBuilder() =>
      AttachmentsControllerAttach201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AttachmentsControllerAttach201Response &&
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
            r'AttachmentsControllerAttach201Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AttachmentsControllerAttach201ResponseBuilder
    implements
        Builder<AttachmentsControllerAttach201Response,
            AttachmentsControllerAttach201ResponseBuilder> {
  _$AttachmentsControllerAttach201Response? _$v;

  AttachmentDtoBuilder? _data;
  AttachmentDtoBuilder get data => _$this._data ??= AttachmentDtoBuilder();
  set data(AttachmentDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AttachmentsControllerAttach201ResponseBuilder() {
    AttachmentsControllerAttach201Response._defaults(this);
  }

  AttachmentsControllerAttach201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AttachmentsControllerAttach201Response other) {
    _$v = other as _$AttachmentsControllerAttach201Response;
  }

  @override
  void update(
      void Function(AttachmentsControllerAttach201ResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AttachmentsControllerAttach201Response build() => _build();

  _$AttachmentsControllerAttach201Response _build() {
    _$AttachmentsControllerAttach201Response _$result;
    try {
      _$result = _$v ??
          _$AttachmentsControllerAttach201Response._(
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
            r'AttachmentsControllerAttach201Response',
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
