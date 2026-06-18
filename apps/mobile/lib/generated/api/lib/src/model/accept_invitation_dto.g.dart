// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'accept_invitation_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AcceptInvitationDto extends AcceptInvitationDto {
  @override
  final String token;

  factory _$AcceptInvitationDto([
    void Function(AcceptInvitationDtoBuilder)? updates,
  ]) =>
      (AcceptInvitationDtoBuilder()..update(updates))._build();

  _$AcceptInvitationDto._({required this.token}) : super._();
  @override
  AcceptInvitationDto rebuild(
    void Function(AcceptInvitationDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  AcceptInvitationDtoBuilder toBuilder() =>
      AcceptInvitationDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AcceptInvitationDto && token == other.token;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, token.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'AcceptInvitationDto',
    )..add('token', token))
        .toString();
  }
}

class AcceptInvitationDtoBuilder
    implements Builder<AcceptInvitationDto, AcceptInvitationDtoBuilder> {
  _$AcceptInvitationDto? _$v;

  String? _token;
  String? get token => _$this._token;
  set token(String? token) => _$this._token = token;

  AcceptInvitationDtoBuilder() {
    AcceptInvitationDto._defaults(this);
  }

  AcceptInvitationDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _token = $v.token;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AcceptInvitationDto other) {
    _$v = other as _$AcceptInvitationDto;
  }

  @override
  void update(void Function(AcceptInvitationDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AcceptInvitationDto build() => _build();

  _$AcceptInvitationDto _build() {
    final _$result = _$v ??
        _$AcceptInvitationDto._(
          token: BuiltValueNullFieldError.checkNotNull(
            token,
            r'AcceptInvitationDto',
            'token',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
