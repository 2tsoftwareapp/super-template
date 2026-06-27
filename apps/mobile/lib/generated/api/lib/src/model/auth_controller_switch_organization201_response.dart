//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/switch_organization_response_dto.dart';
import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'auth_controller_switch_organization201_response.g.dart';

/// AuthControllerSwitchOrganization201Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AuthControllerSwitchOrganization201Response
    implements
        Built<AuthControllerSwitchOrganization201Response,
            AuthControllerSwitchOrganization201ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  SwitchOrganizationResponseDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AuthControllerSwitchOrganization201Response._();

  factory AuthControllerSwitchOrganization201Response([
    void updates(AuthControllerSwitchOrganization201ResponseBuilder b),
  ]) = _$AuthControllerSwitchOrganization201Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AuthControllerSwitchOrganization201ResponseBuilder b) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AuthControllerSwitchOrganization201Response>
      get serializer =>
          _$AuthControllerSwitchOrganization201ResponseSerializer();
}

class _$AuthControllerSwitchOrganization201ResponseSerializer
    implements
        PrimitiveSerializer<AuthControllerSwitchOrganization201Response> {
  @override
  final Iterable<Type> types = const [
    AuthControllerSwitchOrganization201Response,
    _$AuthControllerSwitchOrganization201Response,
  ];

  @override
  final String wireName = r'AuthControllerSwitchOrganization201Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AuthControllerSwitchOrganization201Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(SwitchOrganizationResponseDto),
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
    AuthControllerSwitchOrganization201Response object, {
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
    required AuthControllerSwitchOrganization201ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(
              SwitchOrganizationResponseDto,
            ),
          ) as SwitchOrganizationResponseDto;
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
  AuthControllerSwitchOrganization201Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AuthControllerSwitchOrganization201ResponseBuilder();
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
