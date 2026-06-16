//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'accept_invitation_dto.g.dart';

/// AcceptInvitationDto
///
/// Properties:
/// * [token]
@BuiltValue()
abstract class AcceptInvitationDto
    implements Built<AcceptInvitationDto, AcceptInvitationDtoBuilder> {
  @BuiltValueField(wireName: r'token')
  String get token;

  AcceptInvitationDto._();

  factory AcceptInvitationDto([void updates(AcceptInvitationDtoBuilder b)]) =
      _$AcceptInvitationDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AcceptInvitationDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AcceptInvitationDto> get serializer =>
      _$AcceptInvitationDtoSerializer();
}

class _$AcceptInvitationDtoSerializer
    implements PrimitiveSerializer<AcceptInvitationDto> {
  @override
  final Iterable<Type> types = const [
    AcceptInvitationDto,
    _$AcceptInvitationDto
  ];

  @override
  final String wireName = r'AcceptInvitationDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AcceptInvitationDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'token';
    yield serializers.serialize(
      object.token,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AcceptInvitationDto object, {
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
    required AcceptInvitationDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'token':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.token = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AcceptInvitationDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AcceptInvitationDtoBuilder();
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
