// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'file_url_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$FileUrlDto extends FileUrlDto {
  @override
  final num expiresInSeconds;
  @override
  final String id;
  @override
  final String url;

  factory _$FileUrlDto([void Function(FileUrlDtoBuilder)? updates]) =>
      (FileUrlDtoBuilder()..update(updates))._build();

  _$FileUrlDto._({
    required this.expiresInSeconds,
    required this.id,
    required this.url,
  }) : super._();
  @override
  FileUrlDto rebuild(void Function(FileUrlDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  FileUrlDtoBuilder toBuilder() => FileUrlDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is FileUrlDto &&
        expiresInSeconds == other.expiresInSeconds &&
        id == other.id &&
        url == other.url;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, expiresInSeconds.hashCode);
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, url.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'FileUrlDto')
          ..add('expiresInSeconds', expiresInSeconds)
          ..add('id', id)
          ..add('url', url))
        .toString();
  }
}

class FileUrlDtoBuilder implements Builder<FileUrlDto, FileUrlDtoBuilder> {
  _$FileUrlDto? _$v;

  num? _expiresInSeconds;
  num? get expiresInSeconds => _$this._expiresInSeconds;
  set expiresInSeconds(num? expiresInSeconds) =>
      _$this._expiresInSeconds = expiresInSeconds;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _url;
  String? get url => _$this._url;
  set url(String? url) => _$this._url = url;

  FileUrlDtoBuilder() {
    FileUrlDto._defaults(this);
  }

  FileUrlDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _expiresInSeconds = $v.expiresInSeconds;
      _id = $v.id;
      _url = $v.url;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(FileUrlDto other) {
    _$v = other as _$FileUrlDto;
  }

  @override
  void update(void Function(FileUrlDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  FileUrlDto build() => _build();

  _$FileUrlDto _build() {
    final _$result = _$v ??
        _$FileUrlDto._(
          expiresInSeconds: BuiltValueNullFieldError.checkNotNull(
            expiresInSeconds,
            r'FileUrlDto',
            'expiresInSeconds',
          ),
          id: BuiltValueNullFieldError.checkNotNull(id, r'FileUrlDto', 'id'),
          url: BuiltValueNullFieldError.checkNotNull(url, r'FileUrlDto', 'url'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
