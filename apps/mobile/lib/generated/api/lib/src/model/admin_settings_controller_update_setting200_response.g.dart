// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'admin_settings_controller_update_setting200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminSettingsControllerUpdateSetting200Response
    extends AdminSettingsControllerUpdateSetting200Response {
  @override
  final ApplicationSettingDto data;
  @override
  final RequestMetaDto meta;

  factory _$AdminSettingsControllerUpdateSetting200Response([
    void Function(AdminSettingsControllerUpdateSetting200ResponseBuilder)?
        updates,
  ]) =>
      (AdminSettingsControllerUpdateSetting200ResponseBuilder()
            ..update(updates))
          ._build();

  _$AdminSettingsControllerUpdateSetting200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  AdminSettingsControllerUpdateSetting200Response rebuild(
    void Function(AdminSettingsControllerUpdateSetting200ResponseBuilder)
        updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminSettingsControllerUpdateSetting200ResponseBuilder toBuilder() =>
      AdminSettingsControllerUpdateSetting200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminSettingsControllerUpdateSetting200Response &&
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
      r'AdminSettingsControllerUpdateSetting200Response',
    )
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class AdminSettingsControllerUpdateSetting200ResponseBuilder
    implements
        Builder<AdminSettingsControllerUpdateSetting200Response,
            AdminSettingsControllerUpdateSetting200ResponseBuilder> {
  _$AdminSettingsControllerUpdateSetting200Response? _$v;

  ApplicationSettingDtoBuilder? _data;
  ApplicationSettingDtoBuilder get data =>
      _$this._data ??= ApplicationSettingDtoBuilder();
  set data(ApplicationSettingDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  AdminSettingsControllerUpdateSetting200ResponseBuilder() {
    AdminSettingsControllerUpdateSetting200Response._defaults(this);
  }

  AdminSettingsControllerUpdateSetting200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminSettingsControllerUpdateSetting200Response other) {
    _$v = other as _$AdminSettingsControllerUpdateSetting200Response;
  }

  @override
  void update(
    void Function(AdminSettingsControllerUpdateSetting200ResponseBuilder)?
        updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  AdminSettingsControllerUpdateSetting200Response build() => _build();

  _$AdminSettingsControllerUpdateSetting200Response _build() {
    _$AdminSettingsControllerUpdateSetting200Response _$result;
    try {
      _$result = _$v ??
          _$AdminSettingsControllerUpdateSetting200Response._(
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
          r'AdminSettingsControllerUpdateSetting200Response',
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
