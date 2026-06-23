// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'admin_jobs_controller_get_job_logs200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminJobsControllerGetJobLogs200Response
    extends AdminJobsControllerGetJobLogs200Response {
  @override
  final BuiltList<JobEventDto> data;
  @override
  final PaginationMetaDto meta;

  factory _$AdminJobsControllerGetJobLogs200Response([
    void Function(AdminJobsControllerGetJobLogs200ResponseBuilder)? updates,
  ]) =>
      (AdminJobsControllerGetJobLogs200ResponseBuilder()..update(updates))
          ._build();

  _$AdminJobsControllerGetJobLogs200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AdminJobsControllerGetJobLogs200Response rebuild(
    void Function(AdminJobsControllerGetJobLogs200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminJobsControllerGetJobLogs200ResponseBuilder toBuilder() =>
      AdminJobsControllerGetJobLogs200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminJobsControllerGetJobLogs200Response &&
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
      r'AdminJobsControllerGetJobLogs200Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AdminJobsControllerGetJobLogs200ResponseBuilder
    implements
        Builder<AdminJobsControllerGetJobLogs200Response,
            AdminJobsControllerGetJobLogs200ResponseBuilder> {
  _$AdminJobsControllerGetJobLogs200Response? _$v;

  ListBuilder<JobEventDto>? _data;
  ListBuilder<JobEventDto> get data =>
      _$this._data ??= ListBuilder<JobEventDto>();
  set data(ListBuilder<JobEventDto>? data) => _$this._data = data;

  PaginationMetaDtoBuilder? _meta;
  PaginationMetaDtoBuilder get meta =>
      _$this._meta ??= PaginationMetaDtoBuilder();
  set meta(PaginationMetaDtoBuilder? meta) => _$this._meta = meta;

  AdminJobsControllerGetJobLogs200ResponseBuilder() {
    AdminJobsControllerGetJobLogs200Response._defaults(this);
  }

  AdminJobsControllerGetJobLogs200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminJobsControllerGetJobLogs200Response other) {
    _$v = other as _$AdminJobsControllerGetJobLogs200Response;
  }

  @override
  void update(
    void Function(AdminJobsControllerGetJobLogs200ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AdminJobsControllerGetJobLogs200Response build() => _build();

  _$AdminJobsControllerGetJobLogs200Response _build() {
    _$AdminJobsControllerGetJobLogs200Response _$result;
    try {
      _$result = _$v ??
          _$AdminJobsControllerGetJobLogs200Response._(
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
          r'AdminJobsControllerGetJobLogs200Response',
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
