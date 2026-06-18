// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'create_export_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateExportDto extends CreateExportDto {
  @override
  final String type;
  @override
  final BuiltMap<String, JsonObject?>? filters;
  @override
  final String? idempotencyKey;

  factory _$CreateExportDto([void Function(CreateExportDtoBuilder)? updates]) =>
      (CreateExportDtoBuilder()..update(updates))._build();

  _$CreateExportDto._({required this.type, this.filters, this.idempotencyKey})
      : super._();
  @override
  CreateExportDto rebuild(void Function(CreateExportDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateExportDtoBuilder toBuilder() => CreateExportDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateExportDto &&
        type == other.type &&
        filters == other.filters &&
        idempotencyKey == other.idempotencyKey;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jc(_$hash, filters.hashCode);
    _$hash = $jc(_$hash, idempotencyKey.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateExportDto')
          ..add('type', type)
          ..add('filters', filters)
          ..add('idempotencyKey', idempotencyKey))
        .toString();
  }
}

class CreateExportDtoBuilder
    implements Builder<CreateExportDto, CreateExportDtoBuilder> {
  _$CreateExportDto? _$v;

  String? _type;
  String? get type => _$this._type;
  set type(String? type) => _$this._type = type;

  MapBuilder<String, JsonObject?>? _filters;
  MapBuilder<String, JsonObject?> get filters =>
      _$this._filters ??= MapBuilder<String, JsonObject?>();
  set filters(MapBuilder<String, JsonObject?>? filters) =>
      _$this._filters = filters;

  String? _idempotencyKey;
  String? get idempotencyKey => _$this._idempotencyKey;
  set idempotencyKey(String? idempotencyKey) =>
      _$this._idempotencyKey = idempotencyKey;

  CreateExportDtoBuilder() {
    CreateExportDto._defaults(this);
  }

  CreateExportDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _type = $v.type;
      _filters = $v.filters?.toBuilder();
      _idempotencyKey = $v.idempotencyKey;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateExportDto other) {
    _$v = other as _$CreateExportDto;
  }

  @override
  void update(void Function(CreateExportDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateExportDto build() => _build();

  _$CreateExportDto _build() {
    _$CreateExportDto _$result;
    try {
      _$result = _$v ??
          _$CreateExportDto._(
            type: BuiltValueNullFieldError.checkNotNull(
              type,
              r'CreateExportDto',
              'type',
            ),
            filters: _filters?.build(),
            idempotencyKey: idempotencyKey,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'filters';
        _filters?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'CreateExportDto',
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
