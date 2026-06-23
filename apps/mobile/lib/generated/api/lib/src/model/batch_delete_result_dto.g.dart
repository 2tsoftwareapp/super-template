// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'batch_delete_result_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$BatchDeleteResultDto extends BatchDeleteResultDto {
  @override
  final BuiltList<BatchDeleteResultItemDto> results;

  factory _$BatchDeleteResultDto([
    void Function(BatchDeleteResultDtoBuilder)? updates,
  ]) =>
      (BatchDeleteResultDtoBuilder()..update(updates))._build();

  _$BatchDeleteResultDto._({required this.results}) : super._();
  @override
  BatchDeleteResultDto rebuild(
    void Function(BatchDeleteResultDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  BatchDeleteResultDtoBuilder toBuilder() =>
      BatchDeleteResultDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is BatchDeleteResultDto && results == other.results;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, results.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'BatchDeleteResultDto',
    )..add('results', results))
        .toString();
  }
}

class BatchDeleteResultDtoBuilder
    implements Builder<BatchDeleteResultDto, BatchDeleteResultDtoBuilder> {
  _$BatchDeleteResultDto? _$v;

  ListBuilder<BatchDeleteResultItemDto>? _results;
  ListBuilder<BatchDeleteResultItemDto> get results =>
      _$this._results ??= ListBuilder<BatchDeleteResultItemDto>();
  set results(ListBuilder<BatchDeleteResultItemDto>? results) =>
      _$this._results = results;

  BatchDeleteResultDtoBuilder() {
    BatchDeleteResultDto._defaults(this);
  }

  BatchDeleteResultDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _results = $v.results.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(BatchDeleteResultDto other) {
    _$v = other as _$BatchDeleteResultDto;
  }

  @override
  void update(void Function(BatchDeleteResultDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  BatchDeleteResultDto build() => _build();

  _$BatchDeleteResultDto _build() {
    _$BatchDeleteResultDto _$result;
    try {
      _$result = _$v ?? _$BatchDeleteResultDto._(results: results.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'results';
        results.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'BatchDeleteResultDto',
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
