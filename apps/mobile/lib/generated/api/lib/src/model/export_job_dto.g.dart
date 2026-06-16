// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'export_job_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const ExportJobDtoStatusEnum _$exportJobDtoStatusEnum_PENDING =
    const ExportJobDtoStatusEnum._('PENDING');
const ExportJobDtoStatusEnum _$exportJobDtoStatusEnum_PROCESSING =
    const ExportJobDtoStatusEnum._('PROCESSING');
const ExportJobDtoStatusEnum _$exportJobDtoStatusEnum_COMPLETED =
    const ExportJobDtoStatusEnum._('COMPLETED');
const ExportJobDtoStatusEnum _$exportJobDtoStatusEnum_FAILED =
    const ExportJobDtoStatusEnum._('FAILED');
const ExportJobDtoStatusEnum _$exportJobDtoStatusEnum_CANCELLED =
    const ExportJobDtoStatusEnum._('CANCELLED');

ExportJobDtoStatusEnum _$exportJobDtoStatusEnumValueOf(String name) {
  switch (name) {
    case 'PENDING':
      return _$exportJobDtoStatusEnum_PENDING;
    case 'PROCESSING':
      return _$exportJobDtoStatusEnum_PROCESSING;
    case 'COMPLETED':
      return _$exportJobDtoStatusEnum_COMPLETED;
    case 'FAILED':
      return _$exportJobDtoStatusEnum_FAILED;
    case 'CANCELLED':
      return _$exportJobDtoStatusEnum_CANCELLED;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<ExportJobDtoStatusEnum> _$exportJobDtoStatusEnumValues =
    BuiltSet<ExportJobDtoStatusEnum>(const <ExportJobDtoStatusEnum>[
  _$exportJobDtoStatusEnum_PENDING,
  _$exportJobDtoStatusEnum_PROCESSING,
  _$exportJobDtoStatusEnum_COMPLETED,
  _$exportJobDtoStatusEnum_FAILED,
  _$exportJobDtoStatusEnum_CANCELLED,
]);

Serializer<ExportJobDtoStatusEnum> _$exportJobDtoStatusEnumSerializer =
    _$ExportJobDtoStatusEnumSerializer();

class _$ExportJobDtoStatusEnumSerializer
    implements PrimitiveSerializer<ExportJobDtoStatusEnum> {
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
  final Iterable<Type> types = const <Type>[ExportJobDtoStatusEnum];
  @override
  final String wireName = 'ExportJobDtoStatusEnum';

  @override
  Object serialize(Serializers serializers, ExportJobDtoStatusEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ExportJobDtoStatusEnum deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ExportJobDtoStatusEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$ExportJobDto extends ExportJobDto {
  @override
  final String id;
  @override
  final String type;
  @override
  final ExportJobDtoStatusEnum status;
  @override
  final JsonObject? fileId;
  @override
  final BuiltMap<String, JsonObject?>? filters;
  @override
  final String createdById;
  @override
  final JsonObject? completedAt;
  @override
  final String createdAt;
  @override
  final String updatedAt;

  factory _$ExportJobDto([void Function(ExportJobDtoBuilder)? updates]) =>
      (ExportJobDtoBuilder()..update(updates))._build();

  _$ExportJobDto._(
      {required this.id,
      required this.type,
      required this.status,
      this.fileId,
      this.filters,
      required this.createdById,
      this.completedAt,
      required this.createdAt,
      required this.updatedAt})
      : super._();
  @override
  ExportJobDto rebuild(void Function(ExportJobDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ExportJobDtoBuilder toBuilder() => ExportJobDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ExportJobDto &&
        id == other.id &&
        type == other.type &&
        status == other.status &&
        fileId == other.fileId &&
        filters == other.filters &&
        createdById == other.createdById &&
        completedAt == other.completedAt &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, fileId.hashCode);
    _$hash = $jc(_$hash, filters.hashCode);
    _$hash = $jc(_$hash, createdById.hashCode);
    _$hash = $jc(_$hash, completedAt.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ExportJobDto')
          ..add('id', id)
          ..add('type', type)
          ..add('status', status)
          ..add('fileId', fileId)
          ..add('filters', filters)
          ..add('createdById', createdById)
          ..add('completedAt', completedAt)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class ExportJobDtoBuilder
    implements Builder<ExportJobDto, ExportJobDtoBuilder> {
  _$ExportJobDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _type;
  String? get type => _$this._type;
  set type(String? type) => _$this._type = type;

  ExportJobDtoStatusEnum? _status;
  ExportJobDtoStatusEnum? get status => _$this._status;
  set status(ExportJobDtoStatusEnum? status) => _$this._status = status;

  JsonObject? _fileId;
  JsonObject? get fileId => _$this._fileId;
  set fileId(JsonObject? fileId) => _$this._fileId = fileId;

  MapBuilder<String, JsonObject?>? _filters;
  MapBuilder<String, JsonObject?> get filters =>
      _$this._filters ??= MapBuilder<String, JsonObject?>();
  set filters(MapBuilder<String, JsonObject?>? filters) =>
      _$this._filters = filters;

  String? _createdById;
  String? get createdById => _$this._createdById;
  set createdById(String? createdById) => _$this._createdById = createdById;

  JsonObject? _completedAt;
  JsonObject? get completedAt => _$this._completedAt;
  set completedAt(JsonObject? completedAt) => _$this._completedAt = completedAt;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  ExportJobDtoBuilder() {
    ExportJobDto._defaults(this);
  }

  ExportJobDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _type = $v.type;
      _status = $v.status;
      _fileId = $v.fileId;
      _filters = $v.filters?.toBuilder();
      _createdById = $v.createdById;
      _completedAt = $v.completedAt;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ExportJobDto other) {
    _$v = other as _$ExportJobDto;
  }

  @override
  void update(void Function(ExportJobDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ExportJobDto build() => _build();

  _$ExportJobDto _build() {
    _$ExportJobDto _$result;
    try {
      _$result = _$v ??
          _$ExportJobDto._(
            id: BuiltValueNullFieldError.checkNotNull(
                id, r'ExportJobDto', 'id'),
            type: BuiltValueNullFieldError.checkNotNull(
                type, r'ExportJobDto', 'type'),
            status: BuiltValueNullFieldError.checkNotNull(
                status, r'ExportJobDto', 'status'),
            fileId: fileId,
            filters: _filters?.build(),
            createdById: BuiltValueNullFieldError.checkNotNull(
                createdById, r'ExportJobDto', 'createdById'),
            completedAt: completedAt,
            createdAt: BuiltValueNullFieldError.checkNotNull(
                createdAt, r'ExportJobDto', 'createdAt'),
            updatedAt: BuiltValueNullFieldError.checkNotNull(
                updatedAt, r'ExportJobDto', 'updatedAt'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'filters';
        _filters?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ExportJobDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
