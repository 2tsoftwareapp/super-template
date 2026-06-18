// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'projects_controller_list200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ProjectsControllerList200Response
    extends ProjectsControllerList200Response {
  @override
  final BuiltList<ProjectDto> data;
  @override
  final PaginationMetaDto meta;

  factory _$ProjectsControllerList200Response([
    void Function(ProjectsControllerList200ResponseBuilder)? updates,
  ]) =>
      (ProjectsControllerList200ResponseBuilder()..update(updates))._build();

  _$ProjectsControllerList200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  ProjectsControllerList200Response rebuild(
    void Function(ProjectsControllerList200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  ProjectsControllerList200ResponseBuilder toBuilder() =>
      ProjectsControllerList200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ProjectsControllerList200Response &&
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
    return (newBuiltValueToStringHelper(r'ProjectsControllerList200Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class ProjectsControllerList200ResponseBuilder
    implements
        Builder<ProjectsControllerList200Response,
            ProjectsControllerList200ResponseBuilder> {
  _$ProjectsControllerList200Response? _$v;

  ListBuilder<ProjectDto>? _data;
  ListBuilder<ProjectDto> get data =>
      _$this._data ??= ListBuilder<ProjectDto>();
  set data(ListBuilder<ProjectDto>? data) => _$this._data = data;

  PaginationMetaDtoBuilder? _meta;
  PaginationMetaDtoBuilder get meta =>
      _$this._meta ??= PaginationMetaDtoBuilder();
  set meta(PaginationMetaDtoBuilder? meta) => _$this._meta = meta;

  ProjectsControllerList200ResponseBuilder() {
    ProjectsControllerList200Response._defaults(this);
  }

  ProjectsControllerList200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ProjectsControllerList200Response other) {
    _$v = other as _$ProjectsControllerList200Response;
  }

  @override
  void update(
    void Function(ProjectsControllerList200ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  ProjectsControllerList200Response build() => _build();

  _$ProjectsControllerList200Response _build() {
    _$ProjectsControllerList200Response _$result;
    try {
      _$result = _$v ??
          _$ProjectsControllerList200Response._(
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
          r'ProjectsControllerList200Response',
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
