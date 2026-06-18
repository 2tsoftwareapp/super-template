// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'admin_settings_controller_list_settings200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminSettingsControllerListSettings200Response
    extends AdminSettingsControllerListSettings200Response {
  @override
  final BuiltList<ApplicationSettingDto> data;
  @override
  final RequestMetaDto meta;

  factory _$AdminSettingsControllerListSettings200Response([
    void Function(AdminSettingsControllerListSettings200ResponseBuilder)?
        updates,
  ]) =>
      (AdminSettingsControllerListSettings200ResponseBuilder()..update(updates))
          ._build();

  _$AdminSettingsControllerListSettings200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AdminSettingsControllerListSettings200Response rebuild(
    void Function(AdminSettingsControllerListSettings200ResponseBuilder)
        updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminSettingsControllerListSettings200ResponseBuilder toBuilder() =>
      AdminSettingsControllerListSettings200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminSettingsControllerListSettings200Response &&
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
      r'AdminSettingsControllerListSettings200Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AdminSettingsControllerListSettings200ResponseBuilder
    implements
        Builder<AdminSettingsControllerListSettings200Response,
            AdminSettingsControllerListSettings200ResponseBuilder> {
  _$AdminSettingsControllerListSettings200Response? _$v;

  ListBuilder<ApplicationSettingDto>? _data;
  ListBuilder<ApplicationSettingDto> get data =>
      _$this._data ??= ListBuilder<ApplicationSettingDto>();
  set data(ListBuilder<ApplicationSettingDto>? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AdminSettingsControllerListSettings200ResponseBuilder() {
    AdminSettingsControllerListSettings200Response._defaults(this);
  }

  AdminSettingsControllerListSettings200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminSettingsControllerListSettings200Response other) {
    _$v = other as _$AdminSettingsControllerListSettings200Response;
  }

  @override
  void update(
    void Function(AdminSettingsControllerListSettings200ResponseBuilder)?
        updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AdminSettingsControllerListSettings200Response build() => _build();

  _$AdminSettingsControllerListSettings200Response _build() {
    _$AdminSettingsControllerListSettings200Response _$result;
    try {
      _$result = _$v ??
          _$AdminSettingsControllerListSettings200Response._(
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
          r'AdminSettingsControllerListSettings200Response',
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
