//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'export_audit_logs_query_dto.g.dart';

/// ExportAuditLogsQueryDto
///
/// Properties:
/// * [action]
/// * [actorId]
/// * [from]
/// * [resourceId]
/// * [resourceType]
/// * [to]
@BuiltValue()
abstract class ExportAuditLogsQueryDto
    implements Built<ExportAuditLogsQueryDto, ExportAuditLogsQueryDtoBuilder> {
  @BuiltValueField(wireName: r'action')
  String? get action;

  @BuiltValueField(wireName: r'actorId')
  String? get actorId;

  @BuiltValueField(wireName: r'from')
  DateTime? get from;

  @BuiltValueField(wireName: r'resourceId')
  String? get resourceId;

  @BuiltValueField(wireName: r'resourceType')
  String? get resourceType;

  @BuiltValueField(wireName: r'to')
  DateTime? get to;

  ExportAuditLogsQueryDto._();

  factory ExportAuditLogsQueryDto([
    void updates(ExportAuditLogsQueryDtoBuilder b),
  ]) = _$ExportAuditLogsQueryDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ExportAuditLogsQueryDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ExportAuditLogsQueryDto> get serializer =>
      _$ExportAuditLogsQueryDtoSerializer();
}

class _$ExportAuditLogsQueryDtoSerializer
    implements PrimitiveSerializer<ExportAuditLogsQueryDto> {
  @override
  final Iterable<Type> types = const [
    ExportAuditLogsQueryDto,
    _$ExportAuditLogsQueryDto,
  ];

  @override
  final String wireName = r'ExportAuditLogsQueryDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ExportAuditLogsQueryDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.action != null) {
      yield r'action';
      yield serializers.serialize(
        object.action,
        specifiedType: const FullType(String),
      );
    }
    if (object.actorId != null) {
      yield r'actorId';
      yield serializers.serialize(
        object.actorId,
        specifiedType: const FullType(String),
      );
    }
    if (object.from != null) {
      yield r'from';
      yield serializers.serialize(
        object.from,
        specifiedType: const FullType(DateTime),
      );
    }
    if (object.resourceId != null) {
      yield r'resourceId';
      yield serializers.serialize(
        object.resourceId,
        specifiedType: const FullType(String),
      );
    }
    if (object.resourceType != null) {
      yield r'resourceType';
      yield serializers.serialize(
        object.resourceType,
        specifiedType: const FullType(String),
      );
    }
    if (object.to != null) {
      yield r'to';
      yield serializers.serialize(
        object.to,
        specifiedType: const FullType(DateTime),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ExportAuditLogsQueryDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(
      serializers,
      object,
      specifiedType: specifiedType,
    ).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ExportAuditLogsQueryDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'action':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.action = valueDes;
          break;
        case r'actorId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.actorId = valueDes;
          break;
        case r'from':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.from = valueDes;
          break;
        case r'resourceId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.resourceId = valueDes;
          break;
        case r'resourceType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.resourceType = valueDes;
          break;
        case r'to':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.to = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ExportAuditLogsQueryDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ExportAuditLogsQueryDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}
