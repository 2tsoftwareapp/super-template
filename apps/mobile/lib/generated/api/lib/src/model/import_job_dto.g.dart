// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'import_job_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const ImportJobDtoStatusEnum _$importJobDtoStatusEnum_PENDING =
    const ImportJobDtoStatusEnum._('PENDING');
const ImportJobDtoStatusEnum _$importJobDtoStatusEnum_PROCESSING =
    const ImportJobDtoStatusEnum._('PROCESSING');
const ImportJobDtoStatusEnum _$importJobDtoStatusEnum_COMPLETED =
    const ImportJobDtoStatusEnum._('COMPLETED');
const ImportJobDtoStatusEnum _$importJobDtoStatusEnum_FAILED =
    const ImportJobDtoStatusEnum._('FAILED');
const ImportJobDtoStatusEnum _$importJobDtoStatusEnum_CANCELLED =
    const ImportJobDtoStatusEnum._('CANCELLED');

ImportJobDtoStatusEnum _$importJobDtoStatusEnumValueOf(String name) {
  switch (name) {
    case 'PENDING':
      return _$importJobDtoStatusEnum_PENDING;
    case 'PROCESSING':
      return _$importJobDtoStatusEnum_PROCESSING;
    case 'COMPLETED':
      return _$importJobDtoStatusEnum_COMPLETED;
    case 'FAILED':
      return _$importJobDtoStatusEnum_FAILED;
    case 'CANCELLED':
      return _$importJobDtoStatusEnum_CANCELLED;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<ImportJobDtoStatusEnum> _$importJobDtoStatusEnumValues =
    BuiltSet<ImportJobDtoStatusEnum>(const <ImportJobDtoStatusEnum>[
  _$importJobDtoStatusEnum_PENDING,
  _$importJobDtoStatusEnum_PROCESSING,
  _$importJobDtoStatusEnum_COMPLETED,
  _$importJobDtoStatusEnum_FAILED,
  _$importJobDtoStatusEnum_CANCELLED,
]);

Serializer<ImportJobDtoStatusEnum> _$importJobDtoStatusEnumSerializer =
    _$ImportJobDtoStatusEnumSerializer();

class _$ImportJobDtoStatusEnumSerializer
    implements PrimitiveSerializer<ImportJobDtoStatusEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'PENDING': 'PENDING',
    'PROCESSING': 'PROCESSING',
    'COMPLETED': 'COMPLETED',
    'FAILED': 'FAILED',
    'CANCELLED': 'CANCELLED',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'PENDING': 'PENDING',
    'PROCESSING': 'PROCESSING',
    'COMPLETED': 'COMPLETED',
    'FAILED': 'FAILED',
    'CANCELLED': 'CANCELLED',
  };

  @override
  final Iterable<Type> types = const <Type>[ImportJobDtoStatusEnum];
  @override
  final String wireName = 'ImportJobDtoStatusEnum';

  @override
  Object serialize(Serializers serializers, ImportJobDtoStatusEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ImportJobDtoStatusEnum deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ImportJobDtoStatusEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$ImportJobDto extends ImportJobDto {
  @override
  final String id;
  @override
  final String type;
  @override
  final String fileId;
  @override
  final ImportJobDtoStatusEnum status;
  @override
  final JsonObject? rowCount;
  @override
  final JsonObject? successCount;
  @override
  final JsonObject? errorCount;
  @override
  final BuiltList<JsonObject>? errors;
  @override
  final String createdById;
  @override
  final JsonObject? confirmedAt;
  @override
  final JsonObject? completedAt;
  @override
  final String createdAt;
  @override
  final String updatedAt;

  factory _$ImportJobDto([void Function(ImportJobDtoBuilder)? updates]) =>
      (ImportJobDtoBuilder()..update(updates))._build();

  _$ImportJobDto._(
      {required this.id,
      required this.type,
      required this.fileId,
      required this.status,
      this.rowCount,
      this.successCount,
      this.errorCount,
      this.errors,
      required this.createdById,
      this.confirmedAt,
      this.completedAt,
      required this.createdAt,
      required this.updatedAt})
      : super._();
  @override
  ImportJobDto rebuild(void Function(ImportJobDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ImportJobDtoBuilder toBuilder() => ImportJobDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ImportJobDto &&
        id == other.id &&
        type == other.type &&
        fileId == other.fileId &&
        status == other.status &&
        rowCount == other.rowCount &&
        successCount == other.successCount &&
        errorCount == other.errorCount &&
        errors == other.errors &&
        createdById == other.createdById &&
        confirmedAt == other.confirmedAt &&
        completedAt == other.completedAt &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jc(_$hash, fileId.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, rowCount.hashCode);
    _$hash = $jc(_$hash, successCount.hashCode);
    _$hash = $jc(_$hash, errorCount.hashCode);
    _$hash = $jc(_$hash, errors.hashCode);
    _$hash = $jc(_$hash, createdById.hashCode);
    _$hash = $jc(_$hash, confirmedAt.hashCode);
    _$hash = $jc(_$hash, completedAt.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ImportJobDto')
          ..add('id', id)
          ..add('type', type)
          ..add('fileId', fileId)
          ..add('status', status)
          ..add('rowCount', rowCount)
          ..add('successCount', successCount)
          ..add('errorCount', errorCount)
          ..add('errors', errors)
          ..add('createdById', createdById)
          ..add('confirmedAt', confirmedAt)
          ..add('completedAt', completedAt)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class ImportJobDtoBuilder
    implements Builder<ImportJobDto, ImportJobDtoBuilder> {
  _$ImportJobDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _type;
  String? get type => _$this._type;
  set type(String? type) => _$this._type = type;

  String? _fileId;
  String? get fileId => _$this._fileId;
  set fileId(String? fileId) => _$this._fileId = fileId;

  ImportJobDtoStatusEnum? _status;
  ImportJobDtoStatusEnum? get status => _$this._status;
  set status(ImportJobDtoStatusEnum? status) => _$this._status = status;

  JsonObject? _rowCount;
  JsonObject? get rowCount => _$this._rowCount;
  set rowCount(JsonObject? rowCount) => _$this._rowCount = rowCount;

  JsonObject? _successCount;
  JsonObject? get successCount => _$this._successCount;
  set successCount(JsonObject? successCount) =>
      _$this._successCount = successCount;

  JsonObject? _errorCount;
  JsonObject? get errorCount => _$this._errorCount;
  set errorCount(JsonObject? errorCount) => _$this._errorCount = errorCount;

  ListBuilder<JsonObject>? _errors;
  ListBuilder<JsonObject> get errors =>
      _$this._errors ??= ListBuilder<JsonObject>();
  set errors(ListBuilder<JsonObject>? errors) => _$this._errors = errors;

  String? _createdById;
  String? get createdById => _$this._createdById;
  set createdById(String? createdById) => _$this._createdById = createdById;

  JsonObject? _confirmedAt;
  JsonObject? get confirmedAt => _$this._confirmedAt;
  set confirmedAt(JsonObject? confirmedAt) => _$this._confirmedAt = confirmedAt;

  JsonObject? _completedAt;
  JsonObject? get completedAt => _$this._completedAt;
  set completedAt(JsonObject? completedAt) => _$this._completedAt = completedAt;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  ImportJobDtoBuilder() {
    ImportJobDto._defaults(this);
  }

  ImportJobDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _type = $v.type;
      _fileId = $v.fileId;
      _status = $v.status;
      _rowCount = $v.rowCount;
      _successCount = $v.successCount;
      _errorCount = $v.errorCount;
      _errors = $v.errors?.toBuilder();
      _createdById = $v.createdById;
      _confirmedAt = $v.confirmedAt;
      _completedAt = $v.completedAt;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ImportJobDto other) {
    _$v = other as _$ImportJobDto;
  }

  @override
  void update(void Function(ImportJobDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ImportJobDto build() => _build();

  _$ImportJobDto _build() {
    _$ImportJobDto _$result;
    try {
      _$result = _$v ??
          _$ImportJobDto._(
            id: BuiltValueNullFieldError.checkNotNull(
                id, r'ImportJobDto', 'id'),
            type: BuiltValueNullFieldError.checkNotNull(
                type, r'ImportJobDto', 'type'),
            fileId: BuiltValueNullFieldError.checkNotNull(
                fileId, r'ImportJobDto', 'fileId'),
            status: BuiltValueNullFieldError.checkNotNull(
                status, r'ImportJobDto', 'status'),
            rowCount: rowCount,
            successCount: successCount,
            errorCount: errorCount,
            errors: _errors?.build(),
            createdById: BuiltValueNullFieldError.checkNotNull(
                createdById, r'ImportJobDto', 'createdById'),
            confirmedAt: confirmedAt,
            completedAt: completedAt,
            createdAt: BuiltValueNullFieldError.checkNotNull(
                createdAt, r'ImportJobDto', 'createdAt'),
            updatedAt: BuiltValueNullFieldError.checkNotNull(
                updatedAt, r'ImportJobDto', 'updatedAt'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'errors';
        _errors?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ImportJobDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
