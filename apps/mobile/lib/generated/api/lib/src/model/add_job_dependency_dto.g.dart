// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'add_job_dependency_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AddJobDependencyDto extends AddJobDependencyDto {
  @override
  final String dependsOnJobId;

  factory _$AddJobDependencyDto([
    void Function(AddJobDependencyDtoBuilder)? updates,
  ]) =>
      (AddJobDependencyDtoBuilder()..update(updates))._build();

  _$AddJobDependencyDto._({required this.dependsOnJobId}) : super._();
  @override
  AddJobDependencyDto rebuild(
    void Function(AddJobDependencyDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AddJobDependencyDtoBuilder toBuilder() =>
      AddJobDependencyDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AddJobDependencyDto &&
        dependsOnJobId == other.dependsOnJobId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, dependsOnJobId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'AddJobDependencyDto',
    )..add('dependsOnJobId', dependsOnJobId))
        .toString();
  }
}

class AddJobDependencyDtoBuilder
    implements Builder<AddJobDependencyDto, AddJobDependencyDtoBuilder> {
  _$AddJobDependencyDto? _$v;

  String? _dependsOnJobId;
  String? get dependsOnJobId => _$this._dependsOnJobId;
  set dependsOnJobId(String? dependsOnJobId) =>
      _$this._dependsOnJobId = dependsOnJobId;

  AddJobDependencyDtoBuilder() {
    AddJobDependencyDto._defaults(this);
  }

  AddJobDependencyDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _dependsOnJobId = $v.dependsOnJobId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AddJobDependencyDto other) {
    _$v = other as _$AddJobDependencyDto;
  }

  @override
  void update(void Function(AddJobDependencyDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AddJobDependencyDto build() => _build();

  _$AddJobDependencyDto _build() {
    final _$result = _$v ??
        _$AddJobDependencyDto._(
          dependsOnJobId: BuiltValueNullFieldError.checkNotNull(
            dependsOnJobId,
            r'AddJobDependencyDto',
            'dependsOnJobId',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
