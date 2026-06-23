//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:super_template_api/src/model/request_meta_dto.dart';
import 'package:super_template_api/src/model/mfa_recovery_codes_response_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'mfa_controller_confirm201_response.g.dart';

/// MfaControllerConfirm201Response
///
/// Properties:
/// * [data]
/// * [meta]
@BuiltValue()
abstract class MfaControllerConfirm201Response
    implements
        Built<MfaControllerConfirm201Response,
            MfaControllerConfirm201ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  MfaRecoveryCodesResponseDto get data;

  @BuiltValueField(wireName: r'meta')
  RequestMetaDto get meta;

  MfaControllerConfirm201Response._();

  factory MfaControllerConfirm201Response([
    void updates(MfaControllerConfirm201ResponseBuilder b),
  ]) = _$MfaControllerConfirm201Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MfaControllerConfirm201ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MfaControllerConfirm201Response> get serializer =>
      _$MfaControllerConfirm201ResponseSerializer();
}

class _$MfaControllerConfirm201ResponseSerializer
    implements PrimitiveSerializer<MfaControllerConfirm201Response> {
  @override
  final Iterable<Type> types = const [
    MfaControllerConfirm201Response,
    _$MfaControllerConfirm201Response,
  ];

  @override
  final String wireName = r'MfaControllerConfirm201Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MfaControllerConfirm201Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(MfaRecoveryCodesResponseDto),
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
    MfaControllerConfirm201Response object, {
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
    required MfaControllerConfirm201ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MfaRecoveryCodesResponseDto),
          ) as MfaRecoveryCodesResponseDto;
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
  MfaControllerConfirm201Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MfaControllerConfirm201ResponseBuilder();
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
