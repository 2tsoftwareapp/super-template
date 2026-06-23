//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
// @dart=3.0

import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'send_admin_mail_result_dto.g.dart';

/// SendAdminMailResultDto
///
/// Properties:
/// * [jobId]
/// * [status]
@BuiltValue()
abstract class SendAdminMailResultDto
    implements Built<SendAdminMailResultDto, SendAdminMailResultDtoBuilder> {
  @BuiltValueField(wireName: r'jobId')
  String get jobId;

  @BuiltValueField(wireName: r'status')
  SendAdminMailResultDtoStatusEnum get status;
  // enum statusEnum {  PENDING,  PROCESSING,  COMPLETED,  CANCELLED,  FAILED,  };

  SendAdminMailResultDto._();

  factory SendAdminMailResultDto([
    void updates(SendAdminMailResultDtoBuilder b),
  ]) = _$SendAdminMailResultDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SendAdminMailResultDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SendAdminMailResultDto> get serializer =>
      _$SendAdminMailResultDtoSerializer();
}

class _$SendAdminMailResultDtoSerializer
    implements PrimitiveSerializer<SendAdminMailResultDto> {
  @override
  final Iterable<Type> types = const [
    SendAdminMailResultDto,
    _$SendAdminMailResultDto,
  ];

  @override
  final String wireName = r'SendAdminMailResultDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SendAdminMailResultDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'jobId';
    yield serializers.serialize(
      object.jobId,
      specifiedType: const FullType(String),
    );
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(SendAdminMailResultDtoStatusEnum),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SendAdminMailResultDto object, {
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
    required SendAdminMailResultDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'jobId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.jobId = valueDes;
          break;
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(
              SendAdminMailResultDtoStatusEnum,
            ),
          ) as SendAdminMailResultDtoStatusEnum;
          result.status = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SendAdminMailResultDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SendAdminMailResultDtoBuilder();
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

class SendAdminMailResultDtoStatusEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'PENDING')
  static const SendAdminMailResultDtoStatusEnum PENDING =
      _$sendAdminMailResultDtoStatusEnum_PENDING;
  @BuiltValueEnumConst(wireName: r'PROCESSING')
  static const SendAdminMailResultDtoStatusEnum PROCESSING =
      _$sendAdminMailResultDtoStatusEnum_PROCESSING;
  @BuiltValueEnumConst(wireName: r'COMPLETED')
  static const SendAdminMailResultDtoStatusEnum COMPLETED =
      _$sendAdminMailResultDtoStatusEnum_COMPLETED;
  @BuiltValueEnumConst(wireName: r'CANCELLED')
  static const SendAdminMailResultDtoStatusEnum CANCELLED =
      _$sendAdminMailResultDtoStatusEnum_CANCELLED;
  @BuiltValueEnumConst(wireName: r'FAILED')
  static const SendAdminMailResultDtoStatusEnum FAILED =
      _$sendAdminMailResultDtoStatusEnum_FAILED;

  static Serializer<SendAdminMailResultDtoStatusEnum> get serializer =>
      _$sendAdminMailResultDtoStatusEnumSerializer;

  const SendAdminMailResultDtoStatusEnum._(String name) : super(name);

  static BuiltSet<SendAdminMailResultDtoStatusEnum> get values =>
      _$sendAdminMailResultDtoStatusEnumValues;
  static SendAdminMailResultDtoStatusEnum valueOf(String name) =>
      _$sendAdminMailResultDtoStatusEnumValueOf(name);
}
