// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'admin_notifications_controller_list_jobs200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminNotificationsControllerListJobs200Response
    extends AdminNotificationsControllerListJobs200Response {
  @override
  final BuiltList<NotificationJobDto> data;
  @override
  final PaginationMetaDto meta;

  factory _$AdminNotificationsControllerListJobs200Response([
    void Function(AdminNotificationsControllerListJobs200ResponseBuilder)?
        updates,
  ]) =>
      (AdminNotificationsControllerListJobs200ResponseBuilder()
            ..update(updates))
          ._build();

  _$AdminNotificationsControllerListJobs200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AdminNotificationsControllerListJobs200Response rebuild(
    void Function(AdminNotificationsControllerListJobs200ResponseBuilder)
        updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminNotificationsControllerListJobs200ResponseBuilder toBuilder() =>
      AdminNotificationsControllerListJobs200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminNotificationsControllerListJobs200Response &&
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
      r'AdminNotificationsControllerListJobs200Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AdminNotificationsControllerListJobs200ResponseBuilder
    implements
        Builder<AdminNotificationsControllerListJobs200Response,
            AdminNotificationsControllerListJobs200ResponseBuilder> {
  _$AdminNotificationsControllerListJobs200Response? _$v;

  ListBuilder<NotificationJobDto>? _data;
  ListBuilder<NotificationJobDto> get data =>
      _$this._data ??= ListBuilder<NotificationJobDto>();
  set data(ListBuilder<NotificationJobDto>? data) => _$this._data = data;

  PaginationMetaDtoBuilder? _meta;
  PaginationMetaDtoBuilder get meta =>
      _$this._meta ??= PaginationMetaDtoBuilder();
  set meta(PaginationMetaDtoBuilder? meta) => _$this._meta = meta;

  AdminNotificationsControllerListJobs200ResponseBuilder() {
    AdminNotificationsControllerListJobs200Response._defaults(this);
  }

  AdminNotificationsControllerListJobs200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminNotificationsControllerListJobs200Response other) {
    _$v = other as _$AdminNotificationsControllerListJobs200Response;
  }

  @override
  void update(
    void Function(AdminNotificationsControllerListJobs200ResponseBuilder)?
        updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AdminNotificationsControllerListJobs200Response build() => _build();

  _$AdminNotificationsControllerListJobs200Response _build() {
    _$AdminNotificationsControllerListJobs200Response _$result;
    try {
      _$result = _$v ??
          _$AdminNotificationsControllerListJobs200Response._(
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
          r'AdminNotificationsControllerListJobs200Response',
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
