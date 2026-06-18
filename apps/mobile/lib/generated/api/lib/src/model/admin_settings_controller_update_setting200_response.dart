//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/application_setting_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_settings_controller_update_setting200_response.g.dart';

/// AdminSettingsControllerUpdateSetting200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AdminSettingsControllerUpdateSetting200Response
    implements
        Built<AdminSettingsControllerUpdateSetting200Response,
            AdminSettingsControllerUpdateSetting200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  ApplicationSettingDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AdminSettingsControllerUpdateSetting200Response._();

  factory AdminSettingsControllerUpdateSetting200Response([
    void updates(AdminSettingsControllerUpdateSetting200ResponseBuilder b),
  ]) = _$AdminSettingsControllerUpdateSetting200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(
    AdminSettingsControllerUpdateSetting200ResponseBuilder b,
  ) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminSettingsControllerUpdateSetting200Response>
      get serializer =>
          _$AdminSettingsControllerUpdateSetting200ResponseSerializer();
}

class _$AdminSettingsControllerUpdateSetting200ResponseSerializer
    implements
        PrimitiveSerializer<AdminSettingsControllerUpdateSetting200Response> {
  @override
  final Iterable<Type> types = const [
    AdminSettingsControllerUpdateSetting200Response,
    _$AdminSettingsControllerUpdateSetting200Response,
  ];

  @override
  final String wireName = r'AdminSettingsControllerUpdateSetting200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminSettingsControllerUpdateSetting200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(ApplicationSettingDto),
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
    AdminSettingsControllerUpdateSetting200Response object, {
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
    required AdminSettingsControllerUpdateSetting200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ApplicationSettingDto),
          ) as ApplicationSettingDto;
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
  AdminSettingsControllerUpdateSetting200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminSettingsControllerUpdateSetting200ResponseBuilder();
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
