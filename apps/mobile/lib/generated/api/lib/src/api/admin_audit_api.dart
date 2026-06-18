//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// @dart=3.0

import 'dart:async';

import 'package:built_value/json_object.dart';
import 'package:built_value/serializer.dart';
import 'package:dio/dio.dart';

import 'package:super_template_api/src/api_util.dart';
import 'package:super_template_api/src/model/audit_controller_list_audit_logs200_response.dart';

class AdminAuditApi {
  final Dio _dio;

  final Serializers _serializers;

  const AdminAuditApi(this._dio, this._serializers);

  /// auditControllerListAuditLogs
  ///
  ///
  /// Parameters:
  /// * [page]
  /// * [limit]
  /// * [sortOrder]
  /// * [actorId]
  /// * [action]
  /// * [resourceType]
  /// * [resourceId]
  /// * [from]
  /// * [to]
  /// * [cancelToken] - A [CancelToken] that can be used to cancel the operation
  /// * [headers] - Can be used to add additional headers to the request
  /// * [extras] - Can be used to add flags to the request
  /// * [validateStatus] - A [ValidateStatus] callback that can be used to determine request success based on the HTTP status of the response
  /// * [onSendProgress] - A [ProgressCallback] that can be used to get the send progress
  /// * [onReceiveProgress] - A [ProgressCallback] that can be used to get the receive progress
  ///
  /// Returns a [Future] containing a [Response] with a [AuditControllerListAuditLogs200Response] as data
  /// Throws [DioException] if API call or serialization fails
  Future<Response<AuditControllerListAuditLogs200Response>>
      auditControllerListAuditLogs({
    num? page = 1,
    num? limit = 20,
    String? sortOrder = 'desc',
    String? actorId,
    String? action,
    String? resourceType,
    String? resourceId,
    String? from,
    String? to,
    CancelToken? cancelToken,
    Map<String, dynamic>? headers,
    Map<String, dynamic>? extra,
    ValidateStatus? validateStatus,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    final _path = r'/api/v1/admin/audit-logs';
    final _options = Options(
      method: r'GET',
      headers: <String, dynamic>{...?headers},
      extra: <String, dynamic>{
        'secure': <Map<String, String>>[
          {'type': 'http', 'scheme': 'bearer', 'name': 'bearer'},
        ],
        ...?extra,
      },
      validateStatus: validateStatus,
    );

    final _queryParameters = <String, dynamic>{
      if (page != null)
        r'page': encodeQueryParameter(_serializers, page, const FullType(num)),
      if (limit != null)
        r'limit': encodeQueryParameter(
          _serializers,
          limit,
          const FullType(num),
        ),
      if (sortOrder != null)
        r'sortOrder': encodeQueryParameter(
          _serializers,
          sortOrder,
          const FullType(String),
        ),
      if (actorId != null)
        r'actorId': encodeQueryParameter(
          _serializers,
          actorId,
          const FullType(String),
        ),
      if (action != null)
        r'action': encodeQueryParameter(
          _serializers,
          action,
          const FullType(String),
        ),
      if (resourceType != null)
        r'resourceType': encodeQueryParameter(
          _serializers,
          resourceType,
          const FullType(String),
        ),
      if (resourceId != null)
        r'resourceId': encodeQueryParameter(
          _serializers,
          resourceId,
          const FullType(String),
        ),
      if (from != null)
        r'from': encodeQueryParameter(
          _serializers,
          from,
          const FullType(String),
        ),
      if (to != null)
        r'to': encodeQueryParameter(_serializers, to, const FullType(String)),
    };

    final _response = await _dio.request<Object>(
      _path,
      options: _options,
      queryParameters: _queryParameters,
      cancelToken: cancelToken,
      onSendProgress: onSendProgress,
      onReceiveProgress: onReceiveProgress,
    );

    AuditControllerListAuditLogs200Response? _responseData;

    try {
      final rawResponse = _response.data;
      _responseData = rawResponse == null
          ? null
          : _serializers.deserialize(
              rawResponse,
              specifiedType: const FullType(
                AuditControllerListAuditLogs200Response,
              ),
            ) as AuditControllerListAuditLogs200Response;
    } catch (error, stackTrace) {
      throw DioException(
        requestOptions: _response.requestOptions,
        response: _response,
        type: DioExceptionType.unknown,
        error: error,
        stackTrace: stackTrace,
      );
    }

    return Response<AuditControllerListAuditLogs200Response>(
      data: _responseData,
      headers: _response.headers,
      isRedirect: _response.isRedirect,
      requestOptions: _response.requestOptions,
      redirects: _response.redirects,
      statusCode: _response.statusCode,
      statusMessage: _response.statusMessage,
      extra: _response.extra,
    );
  }
}
