//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/audit_export_result_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'audit_controller_export_audit_logs201_response.g.dart';

/// AuditControllerExportAuditLogs201Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AuditControllerExportAuditLogs201Response
    implements
        Built<AuditControllerExportAuditLogs201Response,
            AuditControllerExportAuditLogs201ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  AuditExportResultDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AuditControllerExportAuditLogs201Response._();

  factory AuditControllerExportAuditLogs201Response([
    void updates(AuditControllerExportAuditLogs201ResponseBuilder b),
  ]) = _$AuditControllerExportAuditLogs201Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AuditControllerExportAuditLogs201ResponseBuilder b) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AuditControllerExportAuditLogs201Response> get serializer =>
      _$AuditControllerExportAuditLogs201ResponseSerializer();
}

class _$AuditControllerExportAuditLogs201ResponseSerializer
    implements PrimitiveSerializer<AuditControllerExportAuditLogs201Response> {
  @override
  final Iterable<Type> types = const [
    AuditControllerExportAuditLogs201Response,
    _$AuditControllerExportAuditLogs201Response,
  ];

  @override
  final String wireName = r'AuditControllerExportAuditLogs201Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AuditControllerExportAuditLogs201Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(AuditExportResultDto),
    );
    yield r'meta';
    yield serializers.serialize(
      object.meta,
      specifiedType: const FullType(RequestMetaDto),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AuditControllerExportAuditLogs201Response object, {
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
    required AuditControllerExportAuditLogs201ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(AuditExportResultDto),
          ) as AuditExportResultDto;
          result.data.replace(valueDes);
          break;
        case r'meta':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(RequestMetaDto),
          ) as RequestMetaDto;
          result.meta.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AuditControllerExportAuditLogs201Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AuditControllerExportAuditLogs201ResponseBuilder();
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
