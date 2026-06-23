// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'admin_jobs_controller_get_job200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminJobsControllerGetJob200Response
    extends AdminJobsControllerGetJob200Response {
  @override
  final JobDto data;
  @override
  final RequestMetaDto meta;

  factory _$AdminJobsControllerGetJob200Response([
    void Function(AdminJobsControllerGetJob200ResponseBuilder)? updates,
  ]) =>
      (AdminJobsControllerGetJob200ResponseBuilder()..update(updates))._build();

  _$AdminJobsControllerGetJob200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AdminJobsControllerGetJob200Response rebuild(
    void Function(AdminJobsControllerGetJob200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminJobsControllerGetJob200ResponseBuilder toBuilder() =>
      AdminJobsControllerGetJob200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminJobsControllerGetJob200Response &&
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
    return (newBuiltValueToStringHelper(r'AdminJobsControllerGetJob200Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AdminJobsControllerGetJob200ResponseBuilder
    implements
        Builder<AdminJobsControllerGetJob200Response,
            AdminJobsControllerGetJob200ResponseBuilder> {
  _$AdminJobsControllerGetJob200Response? _$v;

  JobDtoBuilder? _data;
  JobDtoBuilder get data => _$this._data ??= JobDtoBuilder();
  set data(JobDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AdminJobsControllerGetJob200ResponseBuilder() {
    AdminJobsControllerGetJob200Response._defaults(this);
  }

  AdminJobsControllerGetJob200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminJobsControllerGetJob200Response other) {
    _$v = other as _$AdminJobsControllerGetJob200Response;
  }

  @override
  void update(
    void Function(AdminJobsControllerGetJob200ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AdminJobsControllerGetJob200Response build() => _build();

  _$AdminJobsControllerGetJob200Response _build() {
    _$AdminJobsControllerGetJob200Response _$result;
    try {
      _$result = _$v ??
          _$AdminJobsControllerGetJob200Response._(
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
          r'AdminJobsControllerGetJob200Response',
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
