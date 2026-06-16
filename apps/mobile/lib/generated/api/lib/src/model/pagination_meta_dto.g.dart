// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'pagination_meta_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$PaginationMetaDto extends PaginationMetaDto {
  @override
  final String requestId;
  @override
  final num page;
  @override
  final num limit;
  @override
  final num total;
  @override
  final num totalPages;

  factory _$PaginationMetaDto(
          [void Function(PaginationMetaDtoBuilder)? updates]) =>
      (PaginationMetaDtoBuilder()..update(updates))._build();

  _$PaginationMetaDto._(
      {required this.requestId,
      required this.page,
      required this.limit,
      required this.total,
      required this.totalPages})
      : super._();
  @override
  PaginationMetaDto rebuild(void Function(PaginationMetaDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  PaginationMetaDtoBuilder toBuilder() =>
      PaginationMetaDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is PaginationMetaDto &&
        requestId == other.requestId &&
        page == other.page &&
        limit == other.limit &&
        total == other.total &&
        totalPages == other.totalPages;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, requestId.hashCode);
    _$hash = $jc(_$hash, page.hashCode);
    _$hash = $jc(_$hash, limit.hashCode);
    _$hash = $jc(_$hash, total.hashCode);
    _$hash = $jc(_$hash, totalPages.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'PaginationMetaDto')
          ..add('requestId', requestId)
          ..add('page', page)
          ..add('limit', limit)
          ..add('total', total)
          ..add('totalPages', totalPages))
        .toString();
  }
}

class PaginationMetaDtoBuilder
    implements Builder<PaginationMetaDto, PaginationMetaDtoBuilder> {
  _$PaginationMetaDto? _$v;

  String? _requestId;
  String? get requestId => _$this._requestId;
  set requestId(String? requestId) => _$this._requestId = requestId;

  num? _page;
  num? get page => _$this._page;
  set page(num? page) => _$this._page = page;

  num? _limit;
  num? get limit => _$this._limit;
  set limit(num? limit) => _$this._limit = limit;

  num? _total;
  num? get total => _$this._total;
  set total(num? total) => _$this._total = total;

  num? _totalPages;
  num? get totalPages => _$this._totalPages;
  set totalPages(num? totalPages) => _$this._totalPages = totalPages;

  PaginationMetaDtoBuilder() {
    PaginationMetaDto._defaults(this);
  }

  PaginationMetaDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _requestId = $v.requestId;
      _page = $v.page;
      _limit = $v.limit;
      _total = $v.total;
      _totalPages = $v.totalPages;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(PaginationMetaDto other) {
    _$v = other as _$PaginationMetaDto;
  }

  @override
  void update(void Function(PaginationMetaDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  PaginationMetaDto build() => _build();

  _$PaginationMetaDto _build() {
    final _$result = _$v ??
        _$PaginationMetaDto._(
          requestId: BuiltValueNullFieldError.checkNotNull(
              requestId, r'PaginationMetaDto', 'requestId'),
          page: BuiltValueNullFieldError.checkNotNull(
              page, r'PaginationMetaDto', 'page'),
          limit: BuiltValueNullFieldError.checkNotNull(
              limit, r'PaginationMetaDto', 'limit'),
          total: BuiltValueNullFieldError.checkNotNull(
              total, r'PaginationMetaDto', 'total'),
          totalPages: BuiltValueNullFieldError.checkNotNull(
              totalPages, r'PaginationMetaDto', 'totalPages'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
