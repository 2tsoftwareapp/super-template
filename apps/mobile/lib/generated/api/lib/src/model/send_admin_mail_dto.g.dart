// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'send_admin_mail_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SendAdminMailDto extends SendAdminMailDto {
  @override
  final String? idempotencyKey;
  @override
  final String templateKey;
  @override
  final String to;
  @override
  final BuiltMap<String, String>? variables;

  factory _$SendAdminMailDto([
    void Function(SendAdminMailDtoBuilder)? updates,
  ]) =>
      (SendAdminMailDtoBuilder()..update(updates))._build();

  _$SendAdminMailDto._({
    this.idempotencyKey,
    required this.templateKey,
    required this.to,
    this.variables,
  }) : super._();
  @override
  SendAdminMailDto rebuild(void Function(SendAdminMailDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SendAdminMailDtoBuilder toBuilder() =>
      SendAdminMailDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SendAdminMailDto &&
        idempotencyKey == other.idempotencyKey &&
        templateKey == other.templateKey &&
        to == other.to &&
        variables == other.variables;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, idempotencyKey.hashCode);
    _$hash = $jc(_$hash, templateKey.hashCode);
    _$hash = $jc(_$hash, to.hashCode);
    _$hash = $jc(_$hash, variables.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SendAdminMailDto')
          ..add('idempotencyKey', idempotencyKey)
          ..add('templateKey', templateKey)
          ..add('to', to)
          ..add('variables', variables))
        .toString();
  }
}

class SendAdminMailDtoBuilder
    implements Builder<SendAdminMailDto, SendAdminMailDtoBuilder> {
  _$SendAdminMailDto? _$v;

  String? _idempotencyKey;
  String? get idempotencyKey => _$this._idempotencyKey;
  set idempotencyKey(String? idempotencyKey) =>
      _$this._idempotencyKey = idempotencyKey;

  String? _templateKey;
  String? get templateKey => _$this._templateKey;
  set templateKey(String? templateKey) => _$this._templateKey = templateKey;

  String? _to;
  String? get to => _$this._to;
  set to(String? to) => _$this._to = to;

  MapBuilder<String, String>? _variables;
  MapBuilder<String, String> get variables =>
      _$this._variables ??= MapBuilder<String, String>();
  set variables(MapBuilder<String, String>? variables) =>
      _$this._variables = variables;

  SendAdminMailDtoBuilder() {
    SendAdminMailDto._defaults(this);
  }

  SendAdminMailDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _idempotencyKey = $v.idempotencyKey;
      _templateKey = $v.templateKey;
      _to = $v.to;
      _variables = $v.variables?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SendAdminMailDto other) {
    _$v = other as _$SendAdminMailDto;
  }

  @override
  void update(void Function(SendAdminMailDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SendAdminMailDto build() => _build();

  _$SendAdminMailDto _build() {
    _$SendAdminMailDto _$result;
    try {
      _$result = _$v ??
          _$SendAdminMailDto._(
            idempotencyKey: idempotencyKey,
            templateKey: BuiltValueNullFieldError.checkNotNull(
              templateKey,
              r'SendAdminMailDto',
              'templateKey',
            ),
            to: BuiltValueNullFieldError.checkNotNull(
              to,
              r'SendAdminMailDto',
              'to',
            ),
            variables: _variables?.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'variables';
        _variables?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'SendAdminMailDto',
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
