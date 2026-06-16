// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'preferences_controller_get_my_preferences200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$PreferencesControllerGetMyPreferences200Response
    extends PreferencesControllerGetMyPreferences200Response {
  @override
  final UserPreferencesDto data;
  @override
  final RequestMetaDto meta;

  factory _$PreferencesControllerGetMyPreferences200Response(
          [void Function(
                  PreferencesControllerGetMyPreferences200ResponseBuilder)?
              updates]) =>
      (PreferencesControllerGetMyPreferences200ResponseBuilder()
            ..update(updates))
          ._build();

  _$PreferencesControllerGetMyPreferences200Response._(
      {required this.data, required this.meta})
      : super._();
  @override
  PreferencesControllerGetMyPreferences200Response rebuild(
          void Function(PreferencesControllerGetMyPreferences200ResponseBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  PreferencesControllerGetMyPreferences200ResponseBuilder toBuilder() =>
      PreferencesControllerGetMyPreferences200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is PreferencesControllerGetMyPreferences200Response &&
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
            r'PreferencesControllerGetMyPreferences200Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class PreferencesControllerGetMyPreferences200ResponseBuilder
    implements
        Builder<PreferencesControllerGetMyPreferences200Response,
            PreferencesControllerGetMyPreferences200ResponseBuilder> {
  _$PreferencesControllerGetMyPreferences200Response? _$v;

  UserPreferencesDtoBuilder? _data;
  UserPreferencesDtoBuilder get data =>
      _$this._data ??= UserPreferencesDtoBuilder();
  set data(UserPreferencesDtoBuilder? data) => _$this._data = data;

  RequestMetaDtoBuilder? _meta;
  RequestMetaDtoBuilder get meta => _$this._meta ??= RequestMetaDtoBuilder();
  set meta(RequestMetaDtoBuilder? meta) => _$this._meta = meta;

  PreferencesControllerGetMyPreferences200ResponseBuilder() {
    PreferencesControllerGetMyPreferences200Response._defaults(this);
  }

  PreferencesControllerGetMyPreferences200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(PreferencesControllerGetMyPreferences200Response other) {
    _$v = other as _$PreferencesControllerGetMyPreferences200Response;
  }

  @override
  void update(
      void Function(PreferencesControllerGetMyPreferences200ResponseBuilder)?
          updates) {
    if (updates != null) updates(this);
  }

  @override
  PreferencesControllerGetMyPreferences200Response build() => _build();

  _$PreferencesControllerGetMyPreferences200Response _build() {
    _$PreferencesControllerGetMyPreferences200Response _$result;
    try {
      _$result = _$v ??
          _$PreferencesControllerGetMyPreferences200Response._(
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
            r'PreferencesControllerGetMyPreferences200Response',
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
