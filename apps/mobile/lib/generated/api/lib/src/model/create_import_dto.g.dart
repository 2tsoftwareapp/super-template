// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'create_import_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const CreateImportDtoTypeEnum _$createImportDtoTypeEnum_users =
    const CreateImportDtoTypeEnum._('users');

CreateImportDtoTypeEnum _$createImportDtoTypeEnumValueOf(String name) {
  switch (name) {
    case 'users':
      return _$createImportDtoTypeEnum_users;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<CreateImportDtoTypeEnum> _$createImportDtoTypeEnumValues =
    BuiltSet<CreateImportDtoTypeEnum>(const <CreateImportDtoTypeEnum>[
  _$createImportDtoTypeEnum_users,
]);

Serializer<CreateImportDtoTypeEnum> _$createImportDtoTypeEnumSerializer =
    _$CreateImportDtoTypeEnumSerializer();

class _$CreateImportDtoTypeEnumSerializer
    implements PrimitiveSerializer<CreateImportDtoTypeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'users': 'users',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'users': 'users',
  };

  @override
  final Iterable<Type> types = const <Type>[CreateImportDtoTypeEnum];
  @override
  final String wireName = 'CreateImportDtoTypeEnum';

  @override
  Object serialize(
    Serializers serializers,
    CreateImportDtoTypeEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  CreateImportDtoTypeEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      CreateImportDtoTypeEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$CreateImportDto extends CreateImportDto {
  @override
  final String fileId;
  @override
  final String? idempotencyKey;
  @override
  final CreateImportDtoTypeEnum type;

  factory _$CreateImportDto([void Function(CreateImportDtoBuilder)? updates]) =>
      (CreateImportDtoBuilder()..update(updates))._build();

  _$CreateImportDto._({
    required this.fileId,
    this.idempotencyKey,
    required this.type,
  }) : super._();
  @override
  CreateImportDto rebuild(void Function(CreateImportDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateImportDtoBuilder toBuilder() => CreateImportDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateImportDto &&
        fileId == other.fileId &&
        idempotencyKey == other.idempotencyKey &&
        type == other.type;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, fileId.hashCode);
    _$hash = $jc(_$hash, idempotencyKey.hashCode);
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateImportDto')
          ..add('fileId', fileId)
          ..add('idempotencyKey', idempotencyKey)
          ..add('type', type))
        .toString();
  }
}

class CreateImportDtoBuilder
    implements Builder<CreateImportDto, CreateImportDtoBuilder> {
  _$CreateImportDto? _$v;

  String? _fileId;
  String? get fileId => _$this._fileId;
  set fileId(String? fileId) => _$this._fileId = fileId;

  String? _idempotencyKey;
  String? get idempotencyKey => _$this._idempotencyKey;
  set idempotencyKey(String? idempotencyKey) =>
      _$this._idempotencyKey = idempotencyKey;

  CreateImportDtoTypeEnum? _type;
  CreateImportDtoTypeEnum? get type => _$this._type;
  set type(CreateImportDtoTypeEnum? type) => _$this._type = type;

  CreateImportDtoBuilder() {
    CreateImportDto._defaults(this);
  }

  CreateImportDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _fileId = $v.fileId;
      _idempotencyKey = $v.idempotencyKey;
      _type = $v.type;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateImportDto other) {
    _$v = other as _$CreateImportDto;
  }

  @override
  void update(void Function(CreateImportDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateImportDto build() => _build();

  _$CreateImportDto _build() {
    final _$result = _$v ??
        _$CreateImportDto._(
          fileId: BuiltValueNullFieldError.checkNotNull(
            fileId,
            r'CreateImportDto',
            'fileId',
          ),
          idempotencyKey: idempotencyKey,
          type: BuiltValueNullFieldError.checkNotNull(
            type,
            r'CreateImportDto',
            'type',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
