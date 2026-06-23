// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'file_history_event_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const FileHistoryEventDtoTypeEnum _$fileHistoryEventDtoTypeEnum_version =
    const FileHistoryEventDtoTypeEnum._('version');
const FileHistoryEventDtoTypeEnum _$fileHistoryEventDtoTypeEnum_audit =
    const FileHistoryEventDtoTypeEnum._('audit');

FileHistoryEventDtoTypeEnum _$fileHistoryEventDtoTypeEnumValueOf(String name) {
  switch (name) {
    case 'version':
      return _$fileHistoryEventDtoTypeEnum_version;
    case 'audit':
      return _$fileHistoryEventDtoTypeEnum_audit;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<FileHistoryEventDtoTypeEnum>
    _$fileHistoryEventDtoTypeEnumValues = BuiltSet<FileHistoryEventDtoTypeEnum>(
  const <FileHistoryEventDtoTypeEnum>[
    _$fileHistoryEventDtoTypeEnum_version,
    _$fileHistoryEventDtoTypeEnum_audit,
  ],
);

Serializer<FileHistoryEventDtoTypeEnum>
    _$fileHistoryEventDtoTypeEnumSerializer =
    _$FileHistoryEventDtoTypeEnumSerializer();

class _$FileHistoryEventDtoTypeEnumSerializer
    implements PrimitiveSerializer<FileHistoryEventDtoTypeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'version': 'version',
    'audit': 'audit',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'version': 'version',
    'audit': 'audit',
  };

  @override
  final Iterable<Type> types = const <Type>[FileHistoryEventDtoTypeEnum];
  @override
  final String wireName = 'FileHistoryEventDtoTypeEnum';

  @override
  Object serialize(
    Serializers serializers,
    FileHistoryEventDtoTypeEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  FileHistoryEventDtoTypeEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      FileHistoryEventDtoTypeEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$FileHistoryEventDto extends FileHistoryEventDto {
  @override
  final FileHistoryEventDtoTypeEnum type;
  @override
  final String action;
  @override
  final JsonObject? actorId;
  @override
  final BuiltMap<String, JsonObject?>? metadata;
  @override
  final String createdAt;

  factory _$FileHistoryEventDto([
    void Function(FileHistoryEventDtoBuilder)? updates,
  ]) =>
      (FileHistoryEventDtoBuilder()..update(updates))._build();

  _$FileHistoryEventDto._({
    required this.type,
    required this.action,
    this.actorId,
    this.metadata,
    required this.createdAt,
  }) : super._();
  @override
  FileHistoryEventDto rebuild(
    void Function(FileHistoryEventDtoBuilder) updates,
  ) =>
      (toBuilder()..update(updates)).build();

  @override
  FileHistoryEventDtoBuilder toBuilder() =>
      FileHistoryEventDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is FileHistoryEventDto &&
        type == other.type &&
        action == other.action &&
        actorId == other.actorId &&
        metadata == other.metadata &&
        createdAt == other.createdAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jc(_$hash, action.hashCode);
    _$hash = $jc(_$hash, actorId.hashCode);
    _$hash = $jc(_$hash, metadata.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'FileHistoryEventDto')
          ..add('type', type)
          ..add('action', action)
          ..add('actorId', actorId)
          ..add('metadata', metadata)
          ..add('createdAt', createdAt))
        .toString();
  }
}

class FileHistoryEventDtoBuilder
    implements Builder<FileHistoryEventDto, FileHistoryEventDtoBuilder> {
  _$FileHistoryEventDto? _$v;

  FileHistoryEventDtoTypeEnum? _type;
  FileHistoryEventDtoTypeEnum? get type => _$this._type;
  set type(FileHistoryEventDtoTypeEnum? type) => _$this._type = type;

  String? _action;
  String? get action => _$this._action;
  set action(String? action) => _$this._action = action;

  JsonObject? _actorId;
  JsonObject? get actorId => _$this._actorId;
  set actorId(JsonObject? actorId) => _$this._actorId = actorId;

  MapBuilder<String, JsonObject?>? _metadata;
  MapBuilder<String, JsonObject?> get metadata =>
      _$this._metadata ??= MapBuilder<String, JsonObject?>();
  set metadata(MapBuilder<String, JsonObject?>? metadata) =>
      _$this._metadata = metadata;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  FileHistoryEventDtoBuilder() {
    FileHistoryEventDto._defaults(this);
  }

  FileHistoryEventDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _type = $v.type;
      _action = $v.action;
      _actorId = $v.actorId;
      _metadata = $v.metadata?.toBuilder();
      _createdAt = $v.createdAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(FileHistoryEventDto other) {
    _$v = other as _$FileHistoryEventDto;
  }

  @override
  void update(void Function(FileHistoryEventDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  FileHistoryEventDto build() => _build();

  _$FileHistoryEventDto _build() {
    _$FileHistoryEventDto _$result;
    try {
      _$result = _$v ??
          _$FileHistoryEventDto._(
            type: BuiltValueNullFieldError.checkNotNull(
              type,
              r'FileHistoryEventDto',
              'type',
            ),
            action: BuiltValueNullFieldError.checkNotNull(
              action,
              r'FileHistoryEventDto',
              'action',
            ),
            actorId: actorId,
            metadata: _metadata?.build(),
            createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt,
              r'FileHistoryEventDto',
              'createdAt',
            ),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'metadata';
        _metadata?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'FileHistoryEventDto',
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
