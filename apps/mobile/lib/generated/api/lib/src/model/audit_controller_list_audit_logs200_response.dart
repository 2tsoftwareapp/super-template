//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/audit_log_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:super_template_api/src/model/pagination_meta_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'audit_controller_list_audit_logs200_response.g.dart';

/// AuditControllerListAuditLogs200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AuditControllerListAuditLogs200Response
    implements
        Built<AuditControllerListAuditLogs200Response,
            AuditControllerListAuditLogs200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  BuiltList<AuditLogDto> get data;

  @BuiltValueField(wireName: r'meta')
  PaginationMetaDto get meta;

  AuditControllerListAuditLogs200Response._();

  factory AuditControllerListAuditLogs200Response(
          [void updates(AuditControllerListAuditLogs200ResponseBuilder b)]) =
      _$AuditControllerListAuditLogs200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AuditControllerListAuditLogs200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AuditControllerListAuditLogs200Response> get serializer =>
      _$AuditControllerListAuditLogs200ResponseSerializer();
}

class _$AuditControllerListAuditLogs200ResponseSerializer
    implements PrimitiveSerializer<AuditControllerListAuditLogs200Response> {
  @override
  final Iterable<Type> types = const [
    AuditControllerListAuditLogs200Response,
    _$AuditControllerListAuditLogs200Response
  ];

  @override
  final String wireName = r'AuditControllerListAuditLogs200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AuditControllerListAuditLogs200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(BuiltList, [FullType(AuditLogDto)]),
    );
    yield r'meta';
    yield serializers.serialize(
      object.meta,
      specifiedType: const FullType(PaginationMetaDto),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AuditControllerListAuditLogs200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object,
            specifiedType: specifiedType)
        .toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AuditControllerListAuditLogs200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(AuditLogDto)]),
          ) as BuiltList<AuditLogDto>;
          result.data.replace(valueDes);
          break;
        case r'meta':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(PaginationMetaDto),
          ) as PaginationMetaDto;
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
  AuditControllerListAuditLogs200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AuditControllerListAuditLogs200ResponseBuilder();
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
