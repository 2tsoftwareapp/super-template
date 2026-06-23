// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'admin_mail_controller_list_templates200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminMailControllerListTemplates200Response
    extends AdminMailControllerListTemplates200Response {
  @override
  final BuiltList<MailTemplateDto> data;
  @override
  final RequestMetaDto meta;

  factory _$AdminMailControllerListTemplates200Response([
    void Function(AdminMailControllerListTemplates200ResponseBuilder)? updates,
  ]) =>
      (AdminMailControllerListTemplates200ResponseBuilder()..update(updates))
          ._build();

  _$AdminMailControllerListTemplates200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AdminMailControllerListTemplates200Response rebuild(
    void Function(AdminMailControllerListTemplates200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminMailControllerListTemplates200ResponseBuilder toBuilder() =>
      AdminMailControllerListTemplates200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminMailControllerListTemplates200Response &&
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
      r'AdminMailControllerListTemplates200Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AdminMailControllerListTemplates200ResponseBuilder
    implements
        Builder<AdminMailControllerListTemplates200Response,
            AdminMailControllerListTemplates200ResponseBuilder> {
  _$AdminMailControllerListTemplates200Response? _$v;

  ListBuilder<MailTemplateDto>? _data;
  ListBuilder<MailTemplateDto> get data =>
      _$this._data ??= ListBuilder<MailTemplateDto>();
  set data(ListBuilder<MailTemplateDto>? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AdminMailControllerListTemplates200ResponseBuilder() {
    AdminMailControllerListTemplates200Response._defaults(this);
  }

  AdminMailControllerListTemplates200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminMailControllerListTemplates200Response other) {
    _$v = other as _$AdminMailControllerListTemplates200Response;
  }

  @override
  void update(
    void Function(AdminMailControllerListTemplates200ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AdminMailControllerListTemplates200Response build() => _build();

  _$AdminMailControllerListTemplates200Response _build() {
    _$AdminMailControllerListTemplates200Response _$result;
    try {
      _$result = _$v ??
          _$AdminMailControllerListTemplates200Response._(
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
          r'AdminMailControllerListTemplates200Response',
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
