// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'count_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CountDto extends CountDto {
  @override
  final num count;

  factory _$CountDto([void Function(CountDtoBuilder)? updates]) =>
      (CountDtoBuilder()..update(updates))._build();

  _$CountDto._({required this.count}) : super._();
  @override
  CountDto rebuild(void Function(CountDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CountDtoBuilder toBuilder() => CountDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CountDto && count == other.count;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, count.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'CountDto',
    )..add('count', count)).toString();
  }
}

class CountDtoBuilder implements Builder<CountDto, CountDtoBuilder> {
  _$CountDto? _$v;

  num? _count;
  num? get count => _$this._count;
  set count(num? count) => _$this._count = count;

  CountDtoBuilder() {
    CountDto._defaults(this);
  }

  CountDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _count = $v.count;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CountDto other) {
    _$v = other as _$CountDto;
  }

  @override
  void update(void Function(CountDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CountDto build() => _build();

  _$CountDto _build() {
    final _$result =
        _$v ??
        _$CountDto._(
          count: BuiltValueNullFieldError.checkNotNull(
            count,
            r'CountDto',
            'count',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
