// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'projects_controller_list_attachments200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ProjectsControllerListAttachments200Response
    extends ProjectsControllerListAttachments200Response {
  @override
  final BuiltList<ProjectAttachmentDto> data;
  @override
  final RequestMetaDto meta;

  factory _$ProjectsControllerListAttachments200Response(
          [void Function(ProjectsControllerListAttachments200ResponseBuilder)?
              updates]) =>
      (ProjectsControllerListAttachments200ResponseBuilder()..update(updates))
          ._build();

  _$ProjectsControllerListAttachments200Response._(
      {required this.data, required this.meta})
      : super._();
  @override
  ProjectsControllerListAttachments200Response rebuild(
          void Function(ProjectsControllerListAttachments200ResponseBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ProjectsControllerListAttachments200ResponseBuilder toBuilder() =>
      ProjectsControllerListAttachments200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ProjectsControllerListAttachments200Response &&
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
            r'ProjectsControllerListAttachments200Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class ProjectsControllerListAttachments200ResponseBuilder
    implements
        Builder<ProjectsControllerListAttachments200Response,
            ProjectsControllerListAttachments200ResponseBuilder> {
  _$ProjectsControllerListAttachments200Response? _$v;

  ListBuilder<ProjectAttachmentDto>? _data;
  ListBuilder<ProjectAttachmentDto> get data =>
      _$this._data ??= ListBuilder<ProjectAttachmentDto>();
  set data(ListBuilder<ProjectAttachmentDto>? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  ProjectsControllerListAttachments200ResponseBuilder() {
    ProjectsControllerListAttachments200Response._defaults(this);
  }

  ProjectsControllerListAttachments200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ProjectsControllerListAttachments200Response other) {
    _$v = other as _$ProjectsControllerListAttachments200Response;
  }

  @override
  void update(
      void Function(ProjectsControllerListAttachments200ResponseBuilder)?
          updates) {
    if (updates != null) updates(this);
  }

  @override
  ProjectsControllerListAttachments200Response build() => _build();

  _$ProjectsControllerListAttachments200Response _build() {
    _$ProjectsControllerListAttachments200Response _$result;
    try {
      _$result = _$v ??
          _$ProjectsControllerListAttachments200Response._(
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
            r'ProjectsControllerListAttachments200Response',
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
