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
  Object serialize(
    Serializers serializers,
    ImportJobDtoStatusEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  ImportJobDtoStatusEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      ImportJobDtoStatusEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$ImportJobDto extends ImportJobDto {
  @override
  final JsonObject? completedAt;
  @override
  final JsonObject? confirmedAt;
  @override
  final String createdAt;
  @override
  final String createdById;
  @override
  final JsonObject? errorCount;
  @override
  final BuiltList<JsonObject>? errors;
  @override
  final String fileId;
  @override
  final String id;
  @override
  final JsonObject? rowCount;
  @override
  final ImportJobDtoStatusEnum status;
  @override
  final JsonObject? successCount;
  @override
  final String type;
  @override
  final String updatedAt;

  factory _$ImportJobDto([void Function(ImportJobDtoBuilder)? updates]) =>
      (ImportJobDtoBuilder()..update(updates))._build();

  _$ImportJobDto._({
    this.completedAt,
    this.confirmedAt,
    required this.createdAt,
    required this.createdById,
    this.errorCount,
    this.errors,
    required this.fileId,
    required this.id,
    this.rowCount,
    required this.status,
    this.successCount,
    required this.type,
    required this.updatedAt,
  }) : super._();
  @override
  ImportJobDto rebuild(void Function(ImportJobDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ImportJobDtoBuilder toBuilder() => ImportJobDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ImportJobDto &&
        completedAt == other.completedAt &&
        confirmedAt == other.confirmedAt &&
        createdAt == other.createdAt &&
        createdById == other.createdById &&
        errorCount == other.errorCount &&
        errors == other.errors &&
        fileId == other.fileId &&
        id == other.id &&
        rowCount == other.rowCount &&
        status == other.status &&
        successCount == other.successCount &&
        type == other.type &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, completedAt.hashCode);
    _$hash = $jc(_$hash, confirmedAt.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, createdById.hashCode);
    _$hash = $jc(_$hash, errorCount.hashCode);
    _$hash = $jc(_$hash, errors.hashCode);
    _$hash = $jc(_$hash, fileId.hashCode);
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, rowCount.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, successCount.hashCode);
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ImportJobDto')
          ..add('completedAt', completedAt)
          ..add('confirmedAt', confirmedAt)
          ..add('createdAt', createdAt)
          ..add('createdById', createdById)
          ..add('errorCount', errorCount)
          ..add('errors', errors)
          ..add('fileId', fileId)
          ..add('id', id)
          ..add('rowCount', rowCount)
          ..add('status', status)
          ..add('successCount', successCount)
          ..add('type', type)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class ImportJobDtoBuilder
    implements Builder<ImportJobDto, ImportJobDtoBuilder> {
  _$ImportJobDto? _$v;

  JsonObject? _completedAt;
  JsonObject? get completedAt => _$this._completedAt;
  set completedAt(JsonObject? completedAt) => _$this._completedAt = completedAt;

  JsonObject? _confirmedAt;
  JsonObject? get confirmedAt => _$this._confirmedAt;
  set confirmedAt(JsonObject? confirmedAt) => _$this._confirmedAt = confirmedAt;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _createdById;
  String? get createdById => _$this._createdById;
  set createdById(String? createdById) => _$this._createdById = createdById;

  JsonObject? _errorCount;
  JsonObject? get errorCount => _$this._errorCount;
  set errorCount(JsonObject? errorCount) => _$this._errorCount = errorCount;

  ListBuilder<JsonObject>? _errors;
  ListBuilder<JsonObject> get errors =>
      _$this._errors ??= ListBuilder<JsonObject>();
  set errors(ListBuilder<JsonObject>? errors) => _$this._errors = errors;

  String? _fileId;
  String? get fileId => _$this._fileId;
  set fileId(String? fileId) => _$this._fileId = fileId;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  JsonObject? _rowCount;
  JsonObject? get rowCount => _$this._rowCount;
  set rowCount(JsonObject? rowCount) => _$this._rowCount = rowCount;

  ImportJobDtoStatusEnum? _status;
  ImportJobDtoStatusEnum? get status => _$this._status;
  set status(ImportJobDtoStatusEnum? status) => _$this._status = status;

  JsonObject? _successCount;
  JsonObject? get successCount => _$this._successCount;
  set successCount(JsonObject? successCount) =>
      _$this._successCount = successCount;

  String? _type;
  String? get type => _$this._type;
  set type(String? type) => _$this._type = type;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  ImportJobDtoBuilder() {
    ImportJobDto._defaults(this);
  }

  ImportJobDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _completedAt = $v.completedAt;
      _confirmedAt = $v.confirmedAt;
      _createdAt = $v.createdAt;
      _createdById = $v.createdById;
      _errorCount = $v.errorCount;
      _errors = $v.errors?.toBuilder();
      _fileId = $v.fileId;
      _id = $v.id;
      _rowCount = $v.rowCount;
      _status = $v.status;
      _successCount = $v.successCount;
      _type = $v.type;
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
            completedAt: completedAt,
            confirmedAt: confirmedAt,
            createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt,
              r'ImportJobDto',
              'createdAt',
            ),
            createdById: BuiltValueNullFieldError.checkNotNull(
              createdById,
              r'ImportJobDto',
              'createdById',
            ),
            errorCount: errorCount,
            errors: _errors?.build(),
            fileId: BuiltValueNullFieldError.checkNotNull(
              fileId,
              r'ImportJobDto',
              'fileId',
            ),
            id: BuiltValueNullFieldError.checkNotNull(
              id,
              r'ImportJobDto',
              'id',
            ),
            rowCount: rowCount,
            status: BuiltValueNullFieldError.checkNotNull(
              status,
              r'ImportJobDto',
              'status',
            ),
            successCount: successCount,
            type: BuiltValueNullFieldError.checkNotNull(
              type,
              r'ImportJobDto',
              'type',
            ),
            updatedAt: BuiltValueNullFieldError.checkNotNull(
              updatedAt,
              r'ImportJobDto',
              'updatedAt',
            ),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'errors';
        _errors?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'ImportJobDto',
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
