//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/mfa_setup_response_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'mfa_controller_setup201_response.g.dart';

/// MfaControllerSetup201Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class MfaControllerSetup201Response
    implements
        Built<MfaControllerSetup201Response,
            MfaControllerSetup201ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  MfaSetupResponseDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  MfaControllerSetup201Response._();

  factory MfaControllerSetup201Response([
    void updates(MfaControllerSetup201ResponseBuilder b),
  ]) = _$MfaControllerSetup201Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MfaControllerSetup201ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MfaControllerSetup201Response> get serializer =>
      _$MfaControllerSetup201ResponseSerializer();
}

class _$MfaControllerSetup201ResponseSerializer
    implements PrimitiveSerializer<MfaControllerSetup201Response> {
  @override
  final Iterable<Type> types = const [
    MfaControllerSetup201Response,
    _$MfaControllerSetup201Response,
  ];

  @override
  final String wireName = r'MfaControllerSetup201Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MfaControllerSetup201Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(MfaSetupResponseDto),
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
    MfaControllerSetup201Response object, {
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
    required MfaControllerSetup201ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MfaSetupResponseDto),
          ) as MfaSetupResponseDto;
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
  MfaControllerSetup201Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MfaControllerSetup201ResponseBuilder();
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
