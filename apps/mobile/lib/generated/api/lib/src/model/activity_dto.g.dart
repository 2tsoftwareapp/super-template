// GENERATED CODE - DO NOT MODIFY BY HAND

// @dart=3.0

part of 'activity_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const ActivityDtoVisibilityEnum _$activityDtoVisibilityEnum_PUBLIC =
    const ActivityDtoVisibilityEnum._('PUBLIC');
const ActivityDtoVisibilityEnum _$activityDtoVisibilityEnum_PRIVATE =
    const ActivityDtoVisibilityEnum._('PRIVATE');
const ActivityDtoVisibilityEnum _$activityDtoVisibilityEnum_INTERNAL =
    const ActivityDtoVisibilityEnum._('INTERNAL');

ActivityDtoVisibilityEnum _$activityDtoVisibilityEnumValueOf(String name) {
  switch (name) {
    case 'PUBLIC':
      return _$activityDtoVisibilityEnum_PUBLIC;
    case 'PRIVATE':
      return _$activityDtoVisibilityEnum_PRIVATE;
    case 'INTERNAL':
      return _$activityDtoVisibilityEnum_INTERNAL;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<ActivityDtoVisibilityEnum> _$activityDtoVisibilityEnumValues =
    BuiltSet<ActivityDtoVisibilityEnum>(const <ActivityDtoVisibilityEnum>[
  _$activityDtoVisibilityEnum_PUBLIC,
  _$activityDtoVisibilityEnum_PRIVATE,
  _$activityDtoVisibilityEnum_INTERNAL,
]);

Serializer<ActivityDtoVisibilityEnum> _$activityDtoVisibilityEnumSerializer =
    _$ActivityDtoVisibilityEnumSerializer();

class _$ActivityDtoVisibilityEnumSerializer
    implements PrimitiveSerializer<ActivityDtoVisibilityEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'PUBLIC': 'PUBLIC',
    'PRIVATE': 'PRIVATE',
    'INTERNAL': 'INTERNAL',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'PUBLIC': 'PUBLIC',
    'PRIVATE': 'PRIVATE',
    'INTERNAL': 'INTERNAL',
  };

  @override
  final Iterable<Type> types = const <Type>[ActivityDtoVisibilityEnum];
  @override
  final String wireName = 'ActivityDtoVisibilityEnum';

  @override
  Object serialize(
    Serializers serializers,
    ActivityDtoVisibilityEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      _toWire[object.name] ?? object.name;

  @override
  ActivityDtoVisibilityEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) =>
      ActivityDtoVisibilityEnum.valueOf(
        _fromWire[serialized] ?? (serialized is String ? serialized : ''),
      );
}

class _$ActivityDto extends ActivityDto {
  @override
  final String? actorId;
  @override
  final String createdAt;
  @override
  final String entityId;
  @override
  final String entityType;
  @override
  final String id;
  @override
  final BuiltMap<String, JsonObject?>? metadata;
  @override
  final String summary;
  @override
  final ActivityDtoVisibilityEnum visibility;

  factory _$ActivityDto([void Function(ActivityDtoBuilder)? updates]) =>
      (ActivityDtoBuilder()..update(updates))._build();

  _$ActivityDto._({
    this.actorId,
    required this.createdAt,
    required this.entityId,
    required this.entityType,
    required this.id,
    this.metadata,
    required this.summary,
    required this.visibility,
  }) : super._();
  @override
  ActivityDto rebuild(void Function(ActivityDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ActivityDtoBuilder toBuilder() => ActivityDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ActivityDto &&
        actorId == other.actorId &&
        createdAt == other.createdAt &&
        entityId == other.entityId &&
        entityType == other.entityType &&
        id == other.id &&
        metadata == other.metadata &&
        summary == other.summary &&
        visibility == other.visibility;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, actorId.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, entityId.hashCode);
    _$hash = $jc(_$hash, entityType.hashCode);
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, metadata.hashCode);
    _$hash = $jc(_$hash, summary.hashCode);
    _$hash = $jc(_$hash, visibility.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ActivityDto')
          ..add('actorId', actorId)
          ..add('createdAt', createdAt)
          ..add('entityId', entityId)
          ..add('entityType', entityType)
          ..add('id', id)
          ..add('metadata', metadata)
          ..add('summary', summary)
          ..add('visibility', visibility))
        .toString();
  }
}

class ActivityDtoBuilder implements Builder<ActivityDto, ActivityDtoBuilder> {
  _$ActivityDto? _$v;

  String? _actorId;
  String? get actorId => _$this._actorId;
  set actorId(String? actorId) => _$this._actorId = actorId;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _entityId;
  String? get entityId => _$this._entityId;
  set entityId(String? entityId) => _$this._entityId = entityId;

  String? _entityType;
  String? get entityType => _$this._entityType;
  set entityType(String? entityType) => _$this._entityType = entityType;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  MapBuilder<String, JsonObject?>? _metadata;
  MapBuilder<String, JsonObject?> get metadata =>
      _$this._metadata ??= MapBuilder<String, JsonObject?>();
  set metadata(MapBuilder<String, JsonObject?>? metadata) =>
      _$this._metadata = metadata;

  String? _summary;
  String? get summary => _$this._summary;
  set summary(String? summary) => _$this._summary = summary;

  ActivityDtoVisibilityEnum? _visibility;
  ActivityDtoVisibilityEnum? get visibility => _$this._visibility;
  set visibility(ActivityDtoVisibilityEnum? visibility) =>
      _$this._visibility = visibility;

  ActivityDtoBuilder() {
    ActivityDto._defaults(this);
  }

  ActivityDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _actorId = $v.actorId;
      _createdAt = $v.createdAt;
      _entityId = $v.entityId;
      _entityType = $v.entityType;
      _id = $v.id;
      _metadata = $v.metadata?.toBuilder();
      _summary = $v.summary;
      _visibility = $v.visibility;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ActivityDto other) {
    _$v = other as _$ActivityDto;
  }

  @override
  void update(void Function(ActivityDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ActivityDto build() => _build();

  _$ActivityDto _build() {
    _$ActivityDto _$result;
    try {
      _$result = _$v ??
          _$ActivityDto._(
            actorId: actorId,
            createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt,
              r'ActivityDto',
              'createdAt',
            ),
            entityId: BuiltValueNullFieldError.checkNotNull(
              entityId,
              r'ActivityDto',
              'entityId',
            ),
            entityType: BuiltValueNullFieldError.checkNotNull(
              entityType,
              r'ActivityDto',
              'entityType',
            ),
            id: BuiltValueNullFieldError.checkNotNull(id, r'ActivityDto', 'id'),
            metadata: _metadata?.build(),
            summary: BuiltValueNullFieldError.checkNotNull(
              summary,
              r'ActivityDto',
              'summary',
            ),
            visibility: BuiltValueNullFieldError.checkNotNull(
              visibility,
              r'ActivityDto',
              'visibility',
            ),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'metadata';
        _metadata?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'ActivityDto',
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
