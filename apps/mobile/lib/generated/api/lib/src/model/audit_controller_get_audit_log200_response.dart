//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/audit_log_dto.dart';
import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'audit_controller_get_audit_log200_response.g.dart';

/// AuditControllerGetAuditLog200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AuditControllerGetAuditLog200Response
    implements
        Built<AuditControllerGetAuditLog200Response,
            AuditControllerGetAuditLog200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  AuditLogDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AuditControllerGetAuditLog200Response._();

  factory AuditControllerGetAuditLog200Response([
    void updates(AuditControllerGetAuditLog200ResponseBuilder b),
  ]) = _$AuditControllerGetAuditLog200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AuditControllerGetAuditLog200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AuditControllerGetAuditLog200Response> get serializer =>
      _$AuditControllerGetAuditLog200ResponseSerializer();
}

class _$AuditControllerGetAuditLog200ResponseSerializer
    implements PrimitiveSerializer<AuditControllerGetAuditLog200Response> {
  @override
  final Iterable<Type> types = const [
    AuditControllerGetAuditLog200Response,
    _$AuditControllerGetAuditLog200Response,
  ];

  @override
  final String wireName = r'AuditControllerGetAuditLog200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AuditControllerGetAuditLog200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(AuditLogDto),
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
    AuditControllerGetAuditLog200Response object, {
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
    required AuditControllerGetAuditLog200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(AuditLogDto),
          ) as AuditLogDto;
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
  AuditControllerGetAuditLog200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AuditControllerGetAuditLog200ResponseBuilder();
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
