import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/errors/app_exception.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:mobile_app/features/notifications/domain/notification_item.dart';
import 'package:super_template_api/super_template_api.dart';

final notificationsRepositoryProvider = Provider<NotificationsRepository>(
  (ref) => NotificationsRepository(ref.watch(apiClientProvider)),
);

class NotificationsRepository {
  NotificationsRepository(this._client);

  final SuperTemplateApi _client;
  NotificationsApi get _api => _client.getNotificationsApi();

  Future<List<NotificationItem>> list() async {
    try {
      final response = await _api.notificationsControllerList();
      return response.data!.data
          .map(
            (item) => NotificationItem(
              id: item.id,
              type: item.type,
              title: item.title,
              body: item.body,
              isRead: item.readAt != null,
            ),
          )
          .toList();
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<int> unreadCount() async {
    try {
      final response = await _api.notificationsControllerUnreadCount();
      return response.data!.data.count.toInt();
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> registerDevice({
    required String token,
    required RegisterDeviceDtoPlatformEnum platform,
  }) async {
    try {
      await _api.notificationsControllerRegisterDevice(
        registerDeviceDto: RegisterDeviceDto(
          (builder) => builder
            ..token = token
            ..platform = platform,
        ),
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> unregisterDevice(String token) async {
    try {
      await _api.notificationsControllerUnregisterDevice(token: token);
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }
}
