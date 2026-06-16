// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'role_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RoleDto extends RoleDto {
  @override
  final String id;
  @override
  final String name;
  @override
  final String description;

  factory _$RoleDto([void Function(RoleDtoBuilder)? updates]) =>
      (RoleDtoBuilder()..update(updates))._build();

  _$RoleDto._({required this.id, required this.name, required this.description})
      : super._();
  @override
  RoleDto rebuild(void Function(RoleDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  RoleDtoBuilder toBuilder() => RoleDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RoleDto &&
        id == other.id &&
        name == other.name &&
        description == other.description;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RoleDto')
          ..add('id', id)
          ..add('name', name)
          ..add('description', description))
        .toString();
  }
}

class RoleDtoBuilder implements Builder<RoleDto, RoleDtoBuilder> {
  _$RoleDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _description;
  String? get description => _$this._description;
  set description(String? description) => _$this._description = description;

  RoleDtoBuilder() {
    RoleDto._defaults(this);
  }

  RoleDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _name = $v.name;
      _description = $v.description;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RoleDto other) {
    _$v = other as _$RoleDto;
  }

  @override
  void update(void Function(RoleDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RoleDto build() => _build();

  _$RoleDto _build() {
    final _$result = _$v ??
        _$RoleDto._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'RoleDto', 'id'),
          name: BuiltValueNullFieldError.checkNotNull(name, r'RoleDto', 'name'),
          description: BuiltValueNullFieldError.checkNotNull(
              description, r'RoleDto', 'description'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
