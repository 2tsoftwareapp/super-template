// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'admin_jobs_controller_cancel_job200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminJobsControllerCancelJob200Response
    extends AdminJobsControllerCancelJob200Response {
  @override
  final JobDto data;
  @override
  final RequestMetaDto meta;

  factory _$AdminJobsControllerCancelJob200Response(
          [void Function(AdminJobsControllerCancelJob200ResponseBuilder)?
              updates]) =>
      (AdminJobsControllerCancelJob200ResponseBuilder()..update(updates))
          ._build();

  _$AdminJobsControllerCancelJob200Response._(
      {required this.data, required this.meta})
      : super._();
  @override
  AdminJobsControllerCancelJob200Response rebuild(
          void Function(AdminJobsControllerCancelJob200ResponseBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminJobsControllerCancelJob200ResponseBuilder toBuilder() =>
      AdminJobsControllerCancelJob200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminJobsControllerCancelJob200Response &&
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
            r'AdminJobsControllerCancelJob200Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AdminJobsControllerCancelJob200ResponseBuilder
    implements
        Builder<AdminJobsControllerCancelJob200Response,
            AdminJobsControllerCancelJob200ResponseBuilder> {
  _$AdminJobsControllerCancelJob200Response? _$v;

  JobDtoBuilder? _data;
  JobDtoBuilder get data => _$this._data ??= JobDtoBuilder();
  set data(JobDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AdminJobsControllerCancelJob200ResponseBuilder() {
    AdminJobsControllerCancelJob200Response._defaults(this);
  }

  AdminJobsControllerCancelJob200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminJobsControllerCancelJob200Response other) {
    _$v = other as _$AdminJobsControllerCancelJob200Response;
  }

  @override
  void update(
      void Function(AdminJobsControllerCancelJob200ResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminJobsControllerCancelJob200Response build() => _build();

  _$AdminJobsControllerCancelJob200Response _build() {
    _$AdminJobsControllerCancelJob200Response _$result;
    try {
      _$result = _$v ??
          _$AdminJobsControllerCancelJob200Response._(
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
            r'AdminJobsControllerCancelJob200Response',
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
