import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/notifications/data/notifications_repository.dart';
import 'package:super_template_api/super_template_api.dart';

void main() {
  test('markRead calls notifications mark-read endpoint', () async {
    late String method;
    late String path;

    final dio = Dio(BaseOptions(baseUrl: 'http://test'));
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          method = options.method;
          path = options.path;
          handler.resolve(
            Response(
              requestOptions: options,
              statusCode: 200,
              data: {
                'data': {
                  'id': 'notification-1',
                  'userId': 'user-1',
                  'type': 'test',
                  'title': 'Title',
                  'body': 'Body',
                  'createdAt': '2026-01-01T00:00:00.000Z',
                  'readAt': '2026-01-01T00:00:00.000Z',
                },
                'meta': {'requestId': 'req-1'},
              },
            ),
          );
        },
      ),
    );

    final client = SuperTemplateApi(dio: dio, serializers: standardSerializers);
    final repository = NotificationsRepository(client);

    await repository.markRead('notification-1');

    expect(method, 'PATCH');
    expect(path, '/api/v1/notifications/notification-1/read');
  });
}
