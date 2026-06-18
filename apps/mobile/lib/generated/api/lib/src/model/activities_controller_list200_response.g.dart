// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'activities_controller_list200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ActivitiesControllerList200Response
    extends ActivitiesControllerList200Response {
  @override
  final BuiltList<ActivityDto> data;
  @override
  final PaginationMetaDto meta;

  factory _$ActivitiesControllerList200Response([
    void Function(ActivitiesControllerList200ResponseBuilder)? updates,
  ]) =>
      (ActivitiesControllerList200ResponseBuilder()..update(updates))._build();

  _$ActivitiesControllerList200Response._({
    required this.data,
    required this.meta,
  }) : super._();
  @override
  ActivitiesControllerList200Response rebuild(
    void Function(ActivitiesControllerList200ResponseBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  ActivitiesControllerList200ResponseBuilder toBuilder() =>
      ActivitiesControllerList200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ActivitiesControllerList200Response &&
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
    return (newBuiltValueToStringHelper(r'ActivitiesControllerList200Response')
          ..add('data', data)
          ..add('meta', meta))
        .toString();
  }
}

class ActivitiesControllerList200ResponseBuilder
    implements
        Builder<ActivitiesControllerList200Response,
            ActivitiesControllerList200ResponseBuilder> {
  _$ActivitiesControllerList200Response? _$v;

  ListBuilder<ActivityDto>? _data;
  ListBuilder<ActivityDto> get data =>
      _$this._data ??= ListBuilder<ActivityDto>();
  set data(ListBuilder<ActivityDto>? data) => _$this._data = data;

  PaginationMetaDtoBuilder? _meta;
  PaginationMetaDtoBuilder get meta =>
      _$this._meta ??= PaginationMetaDtoBuilder();
  set meta(PaginationMetaDtoBuilder? meta) => _$this._meta = meta;

  ActivitiesControllerList200ResponseBuilder() {
    ActivitiesControllerList200Response._defaults(this);
  }

  ActivitiesControllerList200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ActivitiesControllerList200Response other) {
    _$v = other as _$ActivitiesControllerList200Response;
  }

  @override
  void update(
    void Function(ActivitiesControllerList200ResponseBuilder)? updates,
  ) {
    if (updates != null) updates(this);
  }

  @override
  ActivitiesControllerList200Response build() => _build();

  _$ActivitiesControllerList200Response _build() {
    _$ActivitiesControllerList200Response _$result;
    try {
      _$result = _$v ??
          _$ActivitiesControllerList200Response._(
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
          r'ActivitiesControllerList200Response',
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
