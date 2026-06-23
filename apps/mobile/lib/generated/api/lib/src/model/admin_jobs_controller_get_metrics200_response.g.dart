// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'admin_jobs_controller_get_metrics200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminJobsControllerGetMetrics200Response
    extends AdminJobsControllerGetMetrics200Response {
  @override
  final JobMetricsDto data;
  @override
  final RequestMetaDto meta;

  factory _$AdminJobsControllerGetMetrics200Response([
    void Function(AdminJobsControllerGetMetrics200ResponseBuilder)? updates,
  ]) =>
      (AdminJobsControllerGetMetrics200ResponseBuilder()..update(updates))
          ._build();

  _$AdminJobsControllerGetMetrics200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AdminJobsControllerGetMetrics200Response rebuild(
    void Function(AdminJobsControllerGetMetrics200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminJobsControllerGetMetrics200ResponseBuilder toBuilder() =>
      AdminJobsControllerGetMetrics200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminJobsControllerGetMetrics200Response &&
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
      r'AdminJobsControllerGetMetrics200Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AdminJobsControllerGetMetrics200ResponseBuilder
    implements
        Builder<AdminJobsControllerGetMetrics200Response,
            AdminJobsControllerGetMetrics200ResponseBuilder> {
  _$AdminJobsControllerGetMetrics200Response? _$v;

  JobMetricsDtoBuilder? _data;
  JobMetricsDtoBuilder get data => _$this._data ??= JobMetricsDtoBuilder();
  set data(JobMetricsDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AdminJobsControllerGetMetrics200ResponseBuilder() {
    AdminJobsControllerGetMetrics200Response._defaults(this);
  }

  AdminJobsControllerGetMetrics200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminJobsControllerGetMetrics200Response other) {
    _$v = other as _$AdminJobsControllerGetMetrics200Response;
  }

  @override
  void update(
    void Function(AdminJobsControllerGetMetrics200ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AdminJobsControllerGetMetrics200Response build() => _build();

  _$AdminJobsControllerGetMetrics200Response _build() {
    _$AdminJobsControllerGetMetrics200Response _$result;
    try {
      _$result = _$v ??
          _$AdminJobsControllerGetMetrics200Response._(
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
          r'AdminJobsControllerGetMetrics200Response',
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
