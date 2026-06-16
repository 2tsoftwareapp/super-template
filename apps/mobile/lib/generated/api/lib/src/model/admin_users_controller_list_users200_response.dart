//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:super_template_api/src/model/user_dto.dart';
import 'package:super_template_api/src/model/pagination_meta_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_users_controller_list_users200_response.g.dart';

/// AdminUsersControllerListUsers200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AdminUsersControllerListUsers200Response
    implements
        Built<AdminUsersControllerListUsers200Response,
            AdminUsersControllerListUsers200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  BuiltList<UserDto> get data;

  @BuiltValueField(wireName: r'meta')
  PaginationMetaDto get meta;

  AdminUsersControllerListUsers200Response._();

  factory AdminUsersControllerListUsers200Response([
    void updates(AdminUsersControllerListUsers200ResponseBuilder b),
  ]) = _$AdminUsersControllerListUsers200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminUsersControllerListUsers200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminUsersControllerListUsers200Response> get serializer =>
      _$AdminUsersControllerListUsers200ResponseSerializer();
}

class _$AdminUsersControllerListUsers200ResponseSerializer
    implements PrimitiveSerializer<AdminUsersControllerListUsers200Response> {
  @override
  final Iterable<Type> types = const [
    AdminUsersControllerListUsers200Response,
    _$AdminUsersControllerListUsers200Response,
  ];

  @override
  final String wireName = r'AdminUsersControllerListUsers200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminUsersControllerListUsers200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(BuiltList, [FullType(UserDto)]),
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
    AdminUsersControllerListUsers200Response object, {
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
    required AdminUsersControllerListUsers200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [
              FullType(UserDto),
            ]),
          ) as BuiltList<UserDto>;
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
  AdminUsersControllerListUsers200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminUsersControllerListUsers200ResponseBuilder();
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
