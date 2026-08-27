// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'mail_preview_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MailPreviewDto extends MailPreviewDto {
  @override
  final String html;
  @override
  final BuiltList<String> missingVariables;
  @override
  final String subject;
  @override
  final String text;

  factory _$MailPreviewDto([void Function(MailPreviewDtoBuilder)? updates]) =>
      (MailPreviewDtoBuilder()..update(updates))._build();

  _$MailPreviewDto._({
    required this.html,
    required this.missingVariables,
    required this.subject,
    required this.text,
  }) : super._();
  @override
  MailPreviewDto rebuild(void Function(MailPreviewDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MailPreviewDtoBuilder toBuilder() => MailPreviewDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MailPreviewDto &&
        html == other.html &&
        missingVariables == other.missingVariables &&
        subject == other.subject &&
        text == other.text;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, html.hashCode);
    _$hash = $jc(_$hash, missingVariables.hashCode);
    _$hash = $jc(_$hash, subject.hashCode);
    _$hash = $jc(_$hash, text.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MailPreviewDto')
          ..add('html', html)
          ..add('missingVariables', missingVariables)
          ..add('subject', subject)
          ..add('text', text))
        .toString();
  }
}

class MailPreviewDtoBuilder
    implements Builder<MailPreviewDto, MailPreviewDtoBuilder> {
  _$MailPreviewDto? _$v;

  String? _html;
  String? get html => _$this._html;
  set html(String? html) => _$this._html = html;

  ListBuilder<String>? _missingVariables;
  ListBuilder<String> get missingVariables =>
      _$this._missingVariables ??= ListBuilder<String>();
  set missingVariables(ListBuilder<String>? missingVariables) =>
      _$this._missingVariables = missingVariables;

  String? _subject;
  String? get subject => _$this._subject;
  set subject(String? subject) => _$this._subject = subject;

  String? _text;
  String? get text => _$this._text;
  set text(String? text) => _$this._text = text;

  MailPreviewDtoBuilder() {
    MailPreviewDto._defaults(this);
  }

  MailPreviewDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _html = $v.html;
      _missingVariables = $v.missingVariables.toBuilder();
      _subject = $v.subject;
      _text = $v.text;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MailPreviewDto other) {
    _$v = other as _$MailPreviewDto;
  }

  @override
  void update(void Function(MailPreviewDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MailPreviewDto build() => _build();

  _$MailPreviewDto _build() {
    _$MailPreviewDto _$result;
    try {
      _$result = _$v ??
          _$MailPreviewDto._(
            html: BuiltValueNullFieldError.checkNotNull(
              html,
              r'MailPreviewDto',
              'html',
            ),
            missingVariables: missingVariables.build(),
            subject: BuiltValueNullFieldError.checkNotNull(
              subject,
              r'MailPreviewDto',
              'subject',
            ),
            text: BuiltValueNullFieldError.checkNotNull(
              text,
              r'MailPreviewDto',
              'text',
            ),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'missingVariables';
        missingVariables.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'MailPreviewDto',
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
