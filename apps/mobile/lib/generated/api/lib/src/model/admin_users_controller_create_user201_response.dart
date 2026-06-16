//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/user_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_users_controller_create_user201_response.g.dart';

/// AdminUsersControllerCreateUser201Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AdminUsersControllerCreateUser201Response
    implements
        Built<AdminUsersControllerCreateUser201Response,
            AdminUsersControllerCreateUser201ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  UserDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AdminUsersControllerCreateUser201Response._();

  factory AdminUsersControllerCreateUser201Response([
    void updates(AdminUsersControllerCreateUser201ResponseBuilder b),
  ]) = _$AdminUsersControllerCreateUser201Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminUsersControllerCreateUser201ResponseBuilder b) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminUsersControllerCreateUser201Response> get serializer =>
      _$AdminUsersControllerCreateUser201ResponseSerializer();
}

class _$AdminUsersControllerCreateUser201ResponseSerializer
    implements PrimitiveSerializer<AdminUsersControllerCreateUser201Response> {
  @override
  final Iterable<Type> types = const [
    AdminUsersControllerCreateUser201Response,
    _$AdminUsersControllerCreateUser201Response,
  ];

  @override
  final String wireName = r'AdminUsersControllerCreateUser201Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminUsersControllerCreateUser201Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(UserDto),
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
    AdminUsersControllerCreateUser201Response object, {
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
    required AdminUsersControllerCreateUser201ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UserDto),
          ) as UserDto;
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
  AdminUsersControllerCreateUser201Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminUsersControllerCreateUser201ResponseBuilder();
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
