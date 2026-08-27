//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/audit_export_result_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'audit_export_controller_export_audit_logs201_response.g.dart';

/// AuditExportControllerExportAuditLogs201Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AuditExportControllerExportAuditLogs201Response
    implements
        Built<AuditExportControllerExportAuditLogs201Response,
            AuditExportControllerExportAuditLogs201ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  AuditExportResultDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AuditExportControllerExportAuditLogs201Response._();

  factory AuditExportControllerExportAuditLogs201Response([
    void updates(AuditExportControllerExportAuditLogs201ResponseBuilder b),
  ]) = _$AuditExportControllerExportAuditLogs201Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(
    AuditExportControllerExportAuditLogs201ResponseBuilder b,
  ) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AuditExportControllerExportAuditLogs201Response>
      get serializer =>
          _$AuditExportControllerExportAuditLogs201ResponseSerializer();
}

class _$AuditExportControllerExportAuditLogs201ResponseSerializer
    implements
        PrimitiveSerializer<AuditExportControllerExportAuditLogs201Response> {
  @override
  final Iterable<Type> types = const [
    AuditExportControllerExportAuditLogs201Response,
    _$AuditExportControllerExportAuditLogs201Response,
  ];

  @override
  final String wireName = r'AuditExportControllerExportAuditLogs201Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AuditExportControllerExportAuditLogs201Response object, {
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
    AuditExportControllerExportAuditLogs201Response object, {
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
    required AuditExportControllerExportAuditLogs201ResponseBuilder result,
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
  AuditExportControllerExportAuditLogs201Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AuditExportControllerExportAuditLogs201ResponseBuilder();
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
