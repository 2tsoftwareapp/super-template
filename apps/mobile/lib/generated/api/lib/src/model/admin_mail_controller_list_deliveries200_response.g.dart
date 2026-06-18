// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'admin_mail_controller_list_deliveries200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminMailControllerListDeliveries200Response
    extends AdminMailControllerListDeliveries200Response {
  @override
  final BuiltList<MailDeliveryDto> data;
  @override
  final PaginationMetaDto meta;

  factory _$AdminMailControllerListDeliveries200Response([
    void Function(AdminMailControllerListDeliveries200ResponseBuilder)? updates,
  ]) =>
      (AdminMailControllerListDeliveries200ResponseBuilder()..update(updates))
          ._build();

  _$AdminMailControllerListDeliveries200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AdminMailControllerListDeliveries200Response rebuild(
    void Function(AdminMailControllerListDeliveries200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminMailControllerListDeliveries200ResponseBuilder toBuilder() =>
      AdminMailControllerListDeliveries200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminMailControllerListDeliveries200Response &&
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
      r'AdminMailControllerListDeliveries200Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AdminMailControllerListDeliveries200ResponseBuilder
    implements
        Builder<AdminMailControllerListDeliveries200Response,
            AdminMailControllerListDeliveries200ResponseBuilder> {
  _$AdminMailControllerListDeliveries200Response? _$v;

  ListBuilder<MailDeliveryDto>? _data;
  ListBuilder<MailDeliveryDto> get data =>
      _$this._data ??= ListBuilder<MailDeliveryDto>();
  set data(ListBuilder<MailDeliveryDto>? data) => _$this._data = data;

  PaginationMetaDtoBuilder? _meta;
  PaginationMetaDtoBuilder get meta =>
      _$this._meta ??= PaginationMetaDtoBuilder();
  set meta(PaginationMetaDtoBuilder? meta) => _$this._meta = meta;

  AdminMailControllerListDeliveries200ResponseBuilder() {
    AdminMailControllerListDeliveries200Response._defaults(this);
  }

  AdminMailControllerListDeliveries200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminMailControllerListDeliveries200Response other) {
    _$v = other as _$AdminMailControllerListDeliveries200Response;
  }

  @override
  void update(
    void Function(AdminMailControllerListDeliveries200ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AdminMailControllerListDeliveries200Response build() => _build();

  _$AdminMailControllerListDeliveries200Response _build() {
    _$AdminMailControllerListDeliveries200Response _$result;
    try {
      _$result = _$v ??
          _$AdminMailControllerListDeliveries200Response._(
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
          r'AdminMailControllerListDeliveries200Response',
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
