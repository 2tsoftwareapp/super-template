// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'admin_jobs_controller_add_dependency201_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminJobsControllerAddDependency201Response
    extends AdminJobsControllerAddDependency201Response {
  @override
  final JobDependencyDto data;
  @override
  final RequestMetaDto meta;

  factory _$AdminJobsControllerAddDependency201Response([
    void Function(AdminJobsControllerAddDependency201ResponseBuilder)? updates,
  ]) =>
      (AdminJobsControllerAddDependency201ResponseBuilder()..update(updates))
          ._build();

  _$AdminJobsControllerAddDependency201Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AdminJobsControllerAddDependency201Response rebuild(
    void Function(AdminJobsControllerAddDependency201ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminJobsControllerAddDependency201ResponseBuilder toBuilder() =>
      AdminJobsControllerAddDependency201ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminJobsControllerAddDependency201Response &&
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
      r'AdminJobsControllerAddDependency201Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AdminJobsControllerAddDependency201ResponseBuilder
    implements
        Builder<AdminJobsControllerAddDependency201Response,
            AdminJobsControllerAddDependency201ResponseBuilder> {
  _$AdminJobsControllerAddDependency201Response? _$v;

  JobDependencyDtoBuilder? _data;
  JobDependencyDtoBuilder get data =>
      _$this._data ??= JobDependencyDtoBuilder();
  set data(JobDependencyDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AdminJobsControllerAddDependency201ResponseBuilder() {
    AdminJobsControllerAddDependency201Response._defaults(this);
  }

  AdminJobsControllerAddDependency201ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminJobsControllerAddDependency201Response other) {
    _$v = other as _$AdminJobsControllerAddDependency201Response;
  }

  @override
  void update(
    void Function(AdminJobsControllerAddDependency201ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AdminJobsControllerAddDependency201Response build() => _build();

  _$AdminJobsControllerAddDependency201Response _build() {
    _$AdminJobsControllerAddDependency201Response _$result;
    try {
      _$result = _$v ??
          _$AdminJobsControllerAddDependency201Response._(
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
          r'AdminJobsControllerAddDependency201Response',
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
