//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:super_template_api/src/model/application_setting_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_settings_controller_list_settings200_response.g.dart';

/// AdminSettingsControllerListSettings200Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class AdminSettingsControllerListSettings200Response
    implements
        Built<AdminSettingsControllerListSettings200Response,
            AdminSettingsControllerListSettings200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  BuiltList<ApplicationSettingDto> get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  AdminSettingsControllerListSettings200Response._();

  factory AdminSettingsControllerListSettings200Response(
          [void updates(
              AdminSettingsControllerListSettings200ResponseBuilder b)]) =
      _$AdminSettingsControllerListSettings200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(
          AdminSettingsControllerListSettings200ResponseBuilder b) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminSettingsControllerListSettings200Response>
      get serializer =>
          _$AdminSettingsControllerListSettings200ResponseSerializer();
}

class _$AdminSettingsControllerListSettings200ResponseSerializer
    implements
        PrimitiveSerializer<AdminSettingsControllerListSettings200Response> {
  @override
  final Iterable<Type> types = const [
    AdminSettingsControllerListSettings200Response,
    _$AdminSettingsControllerListSettings200Response
  ];

  @override
  final String wireName = r'AdminSettingsControllerListSettings200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminSettingsControllerListSettings200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType:
          const FullType(BuiltList, [FullType(ApplicationSettingDto)]),
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
    AdminSettingsControllerListSettings200Response object, {
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
    required AdminSettingsControllerListSettings200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType:
                const FullType(BuiltList, [FullType(ApplicationSettingDto)]),
          ) as BuiltList<ApplicationSettingDto>;
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
  AdminSettingsControllerListSettings200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminSettingsControllerListSettings200ResponseBuilder();
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
