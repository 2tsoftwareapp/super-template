// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'admin_jobs_controller_list_jobs200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminJobsControllerListJobs200Response
    extends AdminJobsControllerListJobs200Response {
  @override
  final BuiltList<JobListDto> data;
  @override
  final PaginationMetaDto meta;

  factory _$AdminJobsControllerListJobs200Response([
    void Function(AdminJobsControllerListJobs200ResponseBuilder)? updates,
  ]) =>
      (AdminJobsControllerListJobs200ResponseBuilder()..update(updates))
          ._build();

  _$AdminJobsControllerListJobs200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AdminJobsControllerListJobs200Response rebuild(
    void Function(AdminJobsControllerListJobs200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminJobsControllerListJobs200ResponseBuilder toBuilder() =>
      AdminJobsControllerListJobs200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminJobsControllerListJobs200Response &&
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
      r'AdminJobsControllerListJobs200Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AdminJobsControllerListJobs200ResponseBuilder
    implements
        Builder<AdminJobsControllerListJobs200Response,
            AdminJobsControllerListJobs200ResponseBuilder> {
  _$AdminJobsControllerListJobs200Response? _$v;

  ListBuilder<JobListDto>? _data;
  ListBuilder<JobListDto> get data =>
      _$this._data ??= ListBuilder<JobListDto>();
  set data(ListBuilder<JobListDto>? data) => _$this._data = data;

  PaginationMetaDtoBuilder? _meta;
  PaginationMetaDtoBuilder get meta =>
      _$this._meta ??= PaginationMetaDtoBuilder();
  set meta(PaginationMetaDtoBuilder? meta) => _$this._meta = meta;

  AdminJobsControllerListJobs200ResponseBuilder() {
    AdminJobsControllerListJobs200Response._defaults(this);
  }

  AdminJobsControllerListJobs200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminJobsControllerListJobs200Response other) {
    _$v = other as _$AdminJobsControllerListJobs200Response;
  }

  @override
  void update(
    void Function(AdminJobsControllerListJobs200ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AdminJobsControllerListJobs200Response build() => _build();

  _$AdminJobsControllerListJobs200Response _build() {
    _$AdminJobsControllerListJobs200Response _$result;
    try {
      _$result = _$v ??
          _$AdminJobsControllerListJobs200Response._(
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
          r'AdminJobsControllerListJobs200Response',
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
