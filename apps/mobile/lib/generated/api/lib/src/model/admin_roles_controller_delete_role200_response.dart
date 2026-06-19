//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/success_flag_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_roles_controller_delete_role200_response.g.dart';

/// AdminRolesControllerDeleteRole200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AdminRolesControllerDeleteRole200Response
    implements
        Built<AdminRolesControllerDeleteRole200Response,
            AdminRolesControllerDeleteRole200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  SuccessFlagDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AdminRolesControllerDeleteRole200Response._();

  factory AdminRolesControllerDeleteRole200Response([
    void updates(AdminRolesControllerDeleteRole200ResponseBuilder b),
  ]) = _$AdminRolesControllerDeleteRole200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminRolesControllerDeleteRole200ResponseBuilder b) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminRolesControllerDeleteRole200Response> get serializer =>
      _$AdminRolesControllerDeleteRole200ResponseSerializer();
}

class _$AdminRolesControllerDeleteRole200ResponseSerializer
    implements PrimitiveSerializer<AdminRolesControllerDeleteRole200Response> {
  @override
  final Iterable<Type> types = const [
    AdminRolesControllerDeleteRole200Response,
    _$AdminRolesControllerDeleteRole200Response,
  ];

  @override
  final String wireName = r'AdminRolesControllerDeleteRole200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminRolesControllerDeleteRole200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(SuccessFlagDto),
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
    AdminRolesControllerDeleteRole200Response object, {
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
    required AdminRolesControllerDeleteRole200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SuccessFlagDto),
          ) as SuccessFlagDto;
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
  AdminRolesControllerDeleteRole200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminRolesControllerDeleteRole200ResponseBuilder();
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
