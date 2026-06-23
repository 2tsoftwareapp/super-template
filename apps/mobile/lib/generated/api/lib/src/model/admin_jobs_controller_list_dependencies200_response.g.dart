// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'admin_jobs_controller_list_dependencies200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminJobsControllerListDependencies200Response
    extends AdminJobsControllerListDependencies200Response {
  @override
  final BuiltList<JobDependencyDto> data;
  @override
  final RequestMetaDto meta;

  factory _$AdminJobsControllerListDependencies200Response([
    void Function(AdminJobsControllerListDependencies200ResponseBuilder)?
        updates,
  ]) =>
      (AdminJobsControllerListDependencies200ResponseBuilder()..update(updates))
          ._build();

  _$AdminJobsControllerListDependencies200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AdminJobsControllerListDependencies200Response rebuild(
    void Function(AdminJobsControllerListDependencies200ResponseBuilder)
        updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminJobsControllerListDependencies200ResponseBuilder toBuilder() =>
      AdminJobsControllerListDependencies200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminJobsControllerListDependencies200Response &&
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
      r'AdminJobsControllerListDependencies200Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AdminJobsControllerListDependencies200ResponseBuilder
    implements
        Builder<AdminJobsControllerListDependencies200Response,
            AdminJobsControllerListDependencies200ResponseBuilder> {
  _$AdminJobsControllerListDependencies200Response? _$v;

  ListBuilder<JobDependencyDto>? _data;
  ListBuilder<JobDependencyDto> get data =>
      _$this._data ??= ListBuilder<JobDependencyDto>();
  set data(ListBuilder<JobDependencyDto>? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AdminJobsControllerListDependencies200ResponseBuilder() {
    AdminJobsControllerListDependencies200Response._defaults(this);
  }

  AdminJobsControllerListDependencies200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminJobsControllerListDependencies200Response other) {
    _$v = other as _$AdminJobsControllerListDependencies200Response;
  }

  @override
  void update(
    void Function(AdminJobsControllerListDependencies200ResponseBuilder)?
        updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AdminJobsControllerListDependencies200Response build() => _build();

  _$AdminJobsControllerListDependencies200Response _build() {
    _$AdminJobsControllerListDependencies200Response _$result;
    try {
      _$result = _$v ??
          _$AdminJobsControllerListDependencies200Response._(
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
          r'AdminJobsControllerListDependencies200Response',
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
