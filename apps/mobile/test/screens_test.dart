import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:lean_mobile/api.dart';
import 'package:lean_mobile/screens/files_screen.dart';
import 'package:lean_mobile/screens/notifications_screen.dart';
import 'package:material_ui/material_ui.dart';

http.Response json(Object body, [int status = 200]) =>
    http.Response(jsonEncode(body), status,
        headers: {'content-type': 'application/json'});

final session = json({
  'data': {
    'accessToken': 'a1',
    'refreshToken': 'r1',
    'user': {'email': 'a@example.local', 'displayName': 'A'},
  },
});

Map<String, dynamic> notification(String id, {bool read = false}) => {
      'id': id,
      'type': 'user.welcome',
      'title': 'Title $id',
      'body': 'Body $id',
      'readAt': read ? '2026-01-01T00:00:00.000Z' : null,
      'createdAt': '2026-01-01T00:00:00.000Z',
    };

Map<String, dynamic> file(String name) => {
      'id': 'f-$name',
      'originalName': name,
      'mimeType': 'text/plain',
      'sizeBytes': 2048,
      'createdAt': '2026-01-01T00:00:00.000Z',
    };

void main() {
  setUp(() => FlutterSecureStorage.setMockInitialValues({}));

  testWidgets('lists notifications and marks one read on tap', (tester) async {
    final read = <String>{};
    final api = ApiClient(
      client: MockClient((request) async {
        if (request.url.path.endsWith('/auth/login')) return session;
        if (request.method == 'PATCH') {
          read.add(request.url.pathSegments[3]);
          return json({'data': notification('n1', read: true)});
        }
        return json({
          'data': [notification('n1', read: read.contains('n1'))],
        });
      }),
    );
    await api.login('a@example.local', 'password1');

    await tester.pumpWidget(MaterialApp(home: NotificationsScreen(api: api)));
    await tester.pumpAndSettle();

    expect(find.text('Title n1'), findsOneWidget);
    expect(find.byIcon(Icons.mark_email_unread), findsOneWidget);

    await tester.tap(find.text('Title n1'));
    await tester.pumpAndSettle();

    expect(read, {'n1'});
    expect(find.byIcon(Icons.drafts), findsOneWidget);
  });

  testWidgets('uploads a picked file as multipart and refreshes the list',
      (tester) async {
    final uploaded = <String>[];
    final api = ApiClient(
      client: MockClient((request) async {
        if (request.url.path.endsWith('/auth/login')) return session;
        if (request.method == 'POST') {
          final body = utf8.decode(request.bodyBytes, allowMalformed: true);
          expect(request.headers['content-type'], startsWith('multipart/'));
          expect(body, contains('filename="notes.txt"'));
          expect(body, contains('content-type: text/plain'));
          uploaded.add('notes.txt');
          return json({'data': file('notes.txt')}, 201);
        }
        return json({'data': uploaded.map(file).toList()});
      }),
    );
    await api.login('a@example.local', 'password1');

    await tester.pumpWidget(MaterialApp(
      home: FilesScreen(
        api: api,
        pickFile: () async => ('notes.txt', Uint8List.fromList([104, 105])),
      ),
    ));
    await tester.pumpAndSettle();
    expect(find.text('No files yet. Tap Upload.'), findsOneWidget);

    await tester.tap(find.text('Upload'));
    await tester.pumpAndSettle();

    expect(uploaded, ['notes.txt']);
    expect(find.text('notes.txt'), findsOneWidget);
    expect(find.text('text/plain · 2.0 KB'), findsOneWidget);
  });

  test('refuses a file type the API would reject, without a request', () async {
    var requests = 0;
    final api = ApiClient(
      client: MockClient((_) async {
        requests += 1;
        return session;
      }),
    );

    await expectLater(
        api.upload('archive.zip', Uint8List(1)), throwsA(isA<ApiException>()));
    expect(requests, 0);
  });
}
