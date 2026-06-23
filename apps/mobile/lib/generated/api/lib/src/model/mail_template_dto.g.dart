// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'mail_template_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MailTemplateDto extends MailTemplateDto {
  @override
  final String key;
  @override
  final bool mandatory;
  @override
  final bool sendable;
  @override
  final BuiltList<String> variables;

  factory _$MailTemplateDto([void Function(MailTemplateDtoBuilder)? updates]) =>
      (MailTemplateDtoBuilder()..update(updates))._build();

  _$MailTemplateDto._({
    required this.key,
    required this.mandatory,
    required this.sendable,
    required this.variables,
  }) : super._();
  @override
  MailTemplateDto rebuild(void Function(MailTemplateDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MailTemplateDtoBuilder toBuilder() => MailTemplateDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MailTemplateDto &&
        key == other.key &&
        mandatory == other.mandatory &&
        sendable == other.sendable &&
        variables == other.variables;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, key.hashCode);
    _$hash = $jc(_$hash, mandatory.hashCode);
    _$hash = $jc(_$hash, sendable.hashCode);
    _$hash = $jc(_$hash, variables.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MailTemplateDto')
          ..add('key', key)
          ..add('mandatory', mandatory)
          ..add('sendable', sendable)
          ..add('variables', variables))
        .toString();
  }
}

class MailTemplateDtoBuilder
    implements Builder<MailTemplateDto, MailTemplateDtoBuilder> {
  _$MailTemplateDto? _$v;

  String? _key;
  String? get key => _$this._key;
  set key(String? key) => _$this._key = key;

  bool? _mandatory;
  bool? get mandatory => _$this._mandatory;
  set mandatory(bool? mandatory) => _$this._mandatory = mandatory;

  bool? _sendable;
  bool? get sendable => _$this._sendable;
  set sendable(bool? sendable) => _$this._sendable = sendable;

  ListBuilder<String>? _variables;
  ListBuilder<String> get variables =>
      _$this._variables ??= ListBuilder<String>();
  set variables(ListBuilder<String>? variables) =>
      _$this._variables = variables;

  MailTemplateDtoBuilder() {
    MailTemplateDto._defaults(this);
  }

  MailTemplateDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _key = $v.key;
      _mandatory = $v.mandatory;
      _sendable = $v.sendable;
      _variables = $v.variables.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MailTemplateDto other) {
    _$v = other as _$MailTemplateDto;
  }

  @override
  void update(void Function(MailTemplateDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MailTemplateDto build() => _build();

  _$MailTemplateDto _build() {
    _$MailTemplateDto _$result;
    try {
      _$result = _$v ??
          _$MailTemplateDto._(
            key: BuiltValueNullFieldError.checkNotNull(
              key,
              r'MailTemplateDto',
              'key',
            ),
            mandatory: BuiltValueNullFieldError.checkNotNull(
              mandatory,
              r'MailTemplateDto',
              'mandatory',
            ),
            sendable: BuiltValueNullFieldError.checkNotNull(
              sendable,
              r'MailTemplateDto',
              'sendable',
            ),
            variables: variables.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'variables';
        variables.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'MailTemplateDto',
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
