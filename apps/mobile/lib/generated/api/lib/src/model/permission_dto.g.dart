// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'permission_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$PermissionDto extends PermissionDto {
  @override
  final String id;
  @override
  final String name;
  @override
  final JsonObject? description;
  @override
  final bool isSystem;

  factory _$PermissionDto([void Function(PermissionDtoBuilder)? updates]) =>
      (PermissionDtoBuilder()..update(updates))._build();

  _$PermissionDto._({
    required this.id,
    required this.name,
    this.description,
    required this.isSystem,
  }) : super._();
  @override
  PermissionDto rebuild(void Function(PermissionDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  PermissionDtoBuilder toBuilder() => PermissionDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is PermissionDto &&
        id == other.id &&
        name == other.name &&
        description == other.description &&
        isSystem == other.isSystem;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jc(_$hash, isSystem.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'PermissionDto')
          ..add('id', id)
          ..add('name', name)
          ..add('description', description)
          ..add('isSystem', isSystem))
        .toString();
  }
}

class PermissionDtoBuilder
    implements Builder<PermissionDto, PermissionDtoBuilder> {
  _$PermissionDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  JsonObject? _description;
  JsonObject? get description => _$this._description;
  set description(JsonObject? description) => _$this._description = description;

  bool? _isSystem;
  bool? get isSystem => _$this._isSystem;
  set isSystem(bool? isSystem) => _$this._isSystem = isSystem;

  PermissionDtoBuilder() {
    PermissionDto._defaults(this);
  }

  PermissionDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _name = $v.name;
      _description = $v.description;
      _isSystem = $v.isSystem;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(PermissionDto other) {
    _$v = other as _$PermissionDto;
  }

  @override
  void update(void Function(PermissionDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  PermissionDto build() => _build();

  _$PermissionDto _build() {
    final _$result = _$v ??
        _$PermissionDto._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'PermissionDto', 'id'),
          name: BuiltValueNullFieldError.checkNotNull(
            name,
            r'PermissionDto',
            'name',
          ),
          description: description,
          isSystem: BuiltValueNullFieldError.checkNotNull(
            isSystem,
            r'PermissionDto',
            'isSystem',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
