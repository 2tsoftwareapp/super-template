// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'projects_controller_create201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ProjectsControllerCreate201Response
    extends ProjectsControllerCreate201Response {
  @override
  final ProjectDto data;
  @override
  final RequestMetaDto meta;

  factory _$ProjectsControllerCreate201Response([
    void Function(ProjectsControllerCreate201ResponseBuilder)? updates,
  ]) =>
      (ProjectsControllerCreate201ResponseBuilder()..update(updates))._build();

  _$ProjectsControllerCreate201Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  ProjectsControllerCreate201Response rebuild(
    void Function(ProjectsControllerCreate201ResponseBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  ProjectsControllerCreate201ResponseBuilder toBuilder() =>
      ProjectsControllerCreate201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ProjectsControllerCreate201Response &&
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
    return (newBuiltValueToStringHelper(r'ProjectsControllerCreate201Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class ProjectsControllerCreate201ResponseBuilder
    implements
        Builder<
          ProjectsControllerCreate201Response,
          ProjectsControllerCreate201ResponseBuilder
        > {
  _$ProjectsControllerCreate201Response? _$v;

  ProjectDtoBuilder? _data;
  ProjectDtoBuilder get data => _$this._data ??= ProjectDtoBuilder();
  set data(ProjectDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  ProjectsControllerCreate201ResponseBuilder() {
    ProjectsControllerCreate201Response._defaults(this);
  }

  ProjectsControllerCreate201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ProjectsControllerCreate201Response other) {
    _$v = other as _$ProjectsControllerCreate201Response;
  }

  @override
  void update(
    void Function(ProjectsControllerCreate201ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  ProjectsControllerCreate201Response build() => _build();

  _$ProjectsControllerCreate201Response _build() {
    _$ProjectsControllerCreate201Response _$result;
    try {
      _$result =
          _$v ??
          _$ProjectsControllerCreate201Response._(
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
          r'ProjectsControllerCreate201Response',
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
