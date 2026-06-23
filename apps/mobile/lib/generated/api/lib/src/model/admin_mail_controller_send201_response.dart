//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/send_admin_mail_result_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_mail_controller_send201_response.g.dart';

/// AdminMailControllerSend201Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AdminMailControllerSend201Response
    implements
        Built<AdminMailControllerSend201Response,
            AdminMailControllerSend201ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  SendAdminMailResultDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AdminMailControllerSend201Response._();

  factory AdminMailControllerSend201Response([
    void updates(AdminMailControllerSend201ResponseBuilder b),
  ]) = _$AdminMailControllerSend201Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminMailControllerSend201ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminMailControllerSend201Response> get serializer =>
      _$AdminMailControllerSend201ResponseSerializer();
}

class _$AdminMailControllerSend201ResponseSerializer
    implements PrimitiveSerializer<AdminMailControllerSend201Response> {
  @override
  final Iterable<Type> types = const [
    AdminMailControllerSend201Response,
    _$AdminMailControllerSend201Response,
  ];

  @override
  final String wireName = r'AdminMailControllerSend201Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminMailControllerSend201Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(SendAdminMailResultDto),
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
    AdminMailControllerSend201Response object, {
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
    required AdminMailControllerSend201ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SendAdminMailResultDto),
          ) as SendAdminMailResultDto;
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
  AdminMailControllerSend201Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminMailControllerSend201ResponseBuilder();
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
