// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'switch_organization_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SwitchOrganizationResponseDto extends SwitchOrganizationResponseDto {
  @override
  final String accessToken;
  @override
  final String organizationId;

  factory _$SwitchOrganizationResponseDto([
    void Function(SwitchOrganizationResponseDtoBuilder)? updates,
  ]) =>
      (SwitchOrganizationResponseDtoBuilder()..update(updates))._build();

  _$SwitchOrganizationResponseDto._({
    required this.accessToken,
    required this.organizationId,
  }) : super._();
  @override
  SwitchOrganizationResponseDto rebuild(
    void Function(SwitchOrganizationResponseDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  SwitchOrganizationResponseDtoBuilder toBuilder() =>
      SwitchOrganizationResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SwitchOrganizationResponseDto &&
        accessToken == other.accessToken &&
        organizationId == other.organizationId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, accessToken.hashCode);
    _$hash = $jc(_$hash, organizationId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SwitchOrganizationResponseDto')
          ..add('accessToken', accessToken)
          ..add('organizationId', organizationId))
        .toString();
  }
}

class SwitchOrganizationResponseDtoBuilder
    implements
        Builder<SwitchOrganizationResponseDto,
            SwitchOrganizationResponseDtoBuilder> {
  _$SwitchOrganizationResponseDto? _$v;

  String? _accessToken;
  String? get accessToken => _$this._accessToken;
  set accessToken(String? accessToken) => _$this._accessToken = accessToken;

  String? _organizationId;
  String? get organizationId => _$this._organizationId;
  set organizationId(String? organizationId) =>
      _$this._organizationId = organizationId;

  SwitchOrganizationResponseDtoBuilder() {
    SwitchOrganizationResponseDto._defaults(this);
  }

  SwitchOrganizationResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _accessToken = $v.accessToken;
      _organizationId = $v.organizationId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SwitchOrganizationResponseDto other) {
    _$v = other as _$SwitchOrganizationResponseDto;
  }

  @override
  void update(void Function(SwitchOrganizationResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SwitchOrganizationResponseDto build() => _build();

  _$SwitchOrganizationResponseDto _build() {
    final _$result = _$v ??
        _$SwitchOrganizationResponseDto._(
          accessToken: BuiltValueNullFieldError.checkNotNull(
            accessToken,
            r'SwitchOrganizationResponseDto',
            'accessToken',
          ),
          organizationId: BuiltValueNullFieldError.checkNotNull(
            organizationId,
            r'SwitchOrganizationResponseDto',
            'organizationId',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
