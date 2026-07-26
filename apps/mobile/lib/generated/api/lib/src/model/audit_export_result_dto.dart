//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'audit_export_result_dto.g.dart';

/// AuditExportResultDto
///
/// Properties:
/// * [fileId]
/// * [rowCount]
/// * [totalMatching]
/// * [truncated]
@BuiltValue()
abstract class AuditExportResultDto
    implements Built<AuditExportResultDto, AuditExportResultDtoBuilder> {
  @BuiltValueField(wireName: r'fileId')
  String get fileId;

  @BuiltValueField(wireName: r'rowCount')
  num get rowCount;

  @BuiltValueField(wireName: r'totalMatching')
  num get totalMatching;

  @BuiltValueField(wireName: r'truncated')
  bool get truncated;

  AuditExportResultDto._();

  factory AuditExportResultDto([void updates(AuditExportResultDtoBuilder b)]) =
      _$AuditExportResultDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AuditExportResultDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AuditExportResultDto> get serializer =>
      _$AuditExportResultDtoSerializer();
}

class _$AuditExportResultDtoSerializer
    implements PrimitiveSerializer<AuditExportResultDto> {
  @override
  final Iterable<Type> types = const [
    AuditExportResultDto,
    _$AuditExportResultDto,
  ];

  @override
  final String wireName = r'AuditExportResultDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AuditExportResultDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'fileId';
    yield serializers.serialize(
      object.fileId,
      specifiedType: const FullType(String),
    );
    yield r'rowCount';
    yield serializers.serialize(
      object.rowCount,
      specifiedType: const FullType(num),
    );
    yield r'totalMatching';
    yield serializers.serialize(
      object.totalMatching,
      specifiedType: const FullType(num),
    );
    yield r'truncated';
    yield serializers.serialize(
      object.truncated,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AuditExportResultDto object, {
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
    required AuditExportResultDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'fileId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.fileId = valueDes;
          break;
        case r'rowCount':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(num)) as num;
          result.rowCount = valueDes;
          break;
        case r'totalMatching':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(num)) as num;
          result.totalMatching = valueDes;
          break;
        case r'truncated':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.truncated = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AuditExportResultDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AuditExportResultDtoBuilder();
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
