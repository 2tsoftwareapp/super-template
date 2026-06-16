//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// @dart=3.0

import 'dart:async';

import 'package:built_value/serializer.dart';
import 'package:dio/dio.dart';

import 'package:super_template_api/src/api_util.dart';
import 'package:super_template_api/src/model/activities_controller_list200_response.dart';

class ActivitiesApi {
  final Dio _dio;

  final Serializers _serializers;

  const ActivitiesApi(this._dio, this._serializers);

  /// activitiesControllerList
  ///
  ///
  /// Parameters:
  /// * [page]
  /// * [limit]
  /// * [sortOrder]
  /// * [entityType]
  /// * [entityId]
  /// * [actorId]
  /// * [cancelToken] - A [CancelToken] that can be used to cancel the operation
  /// * [headers] - Can be used to add additional headers to the request
  /// * [extras] - Can be used to add flags to the request
  /// * [validateStatus] - A [ValidateStatus] callback that can be used to determine request success based on the HTTP status of the response
  /// * [onSendProgress] - A [ProgressCallback] that can be used to get the send progress
  /// * [onReceiveProgress] - A [ProgressCallback] that can be used to get the receive progress
  ///
  /// Returns a [Future] containing a [Response] with a [ActivitiesControllerList200Response] as data
  /// Throws [DioException] if API call or serialization fails
  Future<Response<ActivitiesControllerList200Response>>
      activitiesControllerList({
    num? page = 1,
    num? limit = 20,
    String? sortOrder = 'desc',
    String? entityType,
    String? entityId,
    String? actorId,
    CancelToken? cancelToken,
    Map<String, dynamic>? headers,
    Map<String, dynamic>? extra,
    ValidateStatus? validateStatus,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    final _path = r'/api/v1/activities';
    final _options = Options(
      method: r'GET',
      headers: <String, dynamic>{
        ...?headers,
      },
      extra: <String, dynamic>{
        'secure': <Map<String, String>>[
          {
            'type': 'http',
            'scheme': 'bearer',
            'name': 'bearer',
          },
        ],
        ...?extra,
      },
      validateStatus: validateStatus,
    );

    final _queryParameters = <String, dynamic>{
      if (page != null)
        r'page': encodeQueryParameter(_serializers, page, const FullType(num)),
      if (limit != null)
        r'limit':
            encodeQueryParameter(_serializers, limit, const FullType(num)),
      if (sortOrder != null)
        r'sortOrder': encodeQueryParameter(
            _serializers, sortOrder, const FullType(String)),
      if (entityType != null)
        r'entityType': encodeQueryParameter(
            _serializers, entityType, const FullType(String)),
      if (entityId != null)
        r'entityId': encodeQueryParameter(
            _serializers, entityId, const FullType(String)),
      if (actorId != null)
        r'actorId':
            encodeQueryParameter(_serializers, actorId, const FullType(String)),
    };

    final _response = await _dio.request<Object>(
      _path,
      options: _options,
      queryParameters: _queryParameters,
      cancelToken: cancelToken,
      onSendProgress: onSendProgress,
      onReceiveProgress: onReceiveProgress,
    );

    ActivitiesControllerList200Response? _responseData;

    try {
      final rawResponse = _response.data;
      _responseData = rawResponse == null
          ? null
          : _serializers.deserialize(
              rawResponse,
              specifiedType:
                  const FullType(ActivitiesControllerList200Response),
            ) as ActivitiesControllerList200Response;
    } catch (error, stackTrace) {
      throw DioException(
        requestOptions: _response.requestOptions,
        response: _response,
        type: DioExceptionType.unknown,
        error: error,
        stackTrace: stackTrace,
      );
    }

    return Response<ActivitiesControllerList200Response>(
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
