import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:mobile_app/core/auth/token_bundle.dart';
import 'package:mobile_app/core/auth/token_storage.dart';
import 'package:mobile_app/core/errors/app_exception.dart';
import 'package:mobile_app/core/network/auth_interceptor.dart';
import 'package:mobile_app/features/auth/data/auth_repository.dart';
import 'package:mobile_app/features/auth/domain/auth_session.dart';
import 'package:mobile_app/features/auth/presentation/auth_controller.dart';

class MockTokenStorage extends Mock implements TokenStorage {}

class MockAuthRepository extends Mock implements AuthRepository {}

class MockHttpClientAdapter extends Mock implements HttpClientAdapter {}
class _FakeAuthController extends AuthController {
  @override
  Future<AuthSession?> build() async => const AuthSession(
    userId: 'u1',
    email: 'u@test.com',
    displayName: 'U',
    roles: [],
    permissions: [],
    sessionId: 's1',
  );
}

// A minimal ErrorInterceptorHandler that records outcomes.
class _CapturingHandler extends ErrorInterceptorHandler {
  DioException? passed;
  Response<dynamic>? resolved;

  @override
  void next(DioException err) => passed = err;

  @override
  void resolve(Response<dynamic> response) => resolved = response;
}

DioException _make401({String path = '/api/v1/users'}) {
  final opts = RequestOptions(path: path);
  return DioException(
    requestOptions: opts,
    response: Response<dynamic>(requestOptions: opts, statusCode: 401),
    type: DioExceptionType.badResponse,
  );
}

void main() {
  late ProviderContainer container;
  late MockTokenStorage mockStorage;
  late MockAuthRepository mockRepo;

  setUp(() {
    registerFallbackValue(const TokenBundle(accessToken: '', refreshToken: ''));
    registerFallbackValue(RequestOptions(path: ''));

    mockStorage = MockTokenStorage();
    mockRepo = MockAuthRepository();

    when(() => mockStorage.read()).thenAnswer(
      (_) async => const TokenBundle(
        accessToken: 'old-access',
        refreshToken: 'old-refresh',
      ),
    );
    when(() => mockStorage.clear()).thenAnswer((_) async {});
    when(() => mockStorage.write(any())).thenAnswer((_) async {});

    container = ProviderContainer(
      overrides: [
        tokenStorageProvider.overrideWithValue(mockStorage),
        authRepositoryProvider.overrideWith((_) => mockRepo),
        authControllerProvider.overrideWith(_FakeAuthController.new),
      ],
    );
  });

  tearDown(() => container.dispose());

  test('concurrent 401s share one refresh future', () async {
    var refreshCallCount = 0;
    final refreshCompleter = Completer<TokenBundle?>();

    when(() => mockRepo.refresh()).thenAnswer((_) {
      refreshCallCount++;
      return refreshCompleter.future;
    });

    final interceptor = container.read(authInterceptorProvider);

    final h1 = _CapturingHandler();
    final h2 = _CapturingHandler();

    // Start two concurrent error handlers before either completes.
    final f1 = interceptor.onError(_make401(), h1);
    final f2 = interceptor.onError(_make401(), h2);

    // Resolve the shared refresh future.
    refreshCompleter.complete(
      const TokenBundle(accessToken: 'new-access', refreshToken: 'new-refresh'),
    );

    await Future.wait([f1, f2]);

    expect(
      refreshCallCount,
      equals(1),
      reason: 'refresh should be called only once for concurrent 401s',
    );
  });

  test('refresh failure clears storage and invalidates auth state', () async {
    when(
      () => mockRepo.refresh(),
    ).thenThrow(const AppException('network error'));

    // Ensure the auth controller starts in an authenticated state.
    await container.read(authControllerProvider.future);
    expect(
      container.read(authControllerProvider).valueOrNull?.isAuthenticated,
      isTrue,
    );

    final interceptor = container.read(authInterceptorProvider);
    final handler = _CapturingHandler();
    await interceptor.onError(_make401(), handler);

    verify(() => mockStorage.clear()).called(1);
    expect(
      container.read(authControllerProvider).valueOrNull,
      isNull,
      reason: 'auth state should be invalidated after refresh failure',
    );
    expect(
      handler.passed,
      isNotNull,
      reason: 'original error should be passed through',
    );
  });

  test('request marked retried is not refreshed again', () async {
    when(() => mockRepo.refresh()).thenAnswer(
      (_) async => const TokenBundle(
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      ),
    );

    final interceptor = container.read(authInterceptorProvider);
    final opts = RequestOptions(path: '/api/v1/users')..extra['retried'] = true;
    final err = DioException(
      requestOptions: opts,
      response: Response<dynamic>(requestOptions: opts, statusCode: 401),
      type: DioExceptionType.badResponse,
    );

    final handler = _CapturingHandler();
    await interceptor.onError(err, handler);

    verifyNever(() => mockRepo.refresh());
    expect(handler.passed, isNotNull);
  });

  test('401 retry inherits httpClientAdapter from parent dio and resolves', () async {
    final mockAdapter = MockHttpClientAdapter();
    final parentDio = Dio()..httpClientAdapter = mockAdapter;

    when(() => mockRepo.refresh()).thenAnswer(
      (_) async => const TokenBundle(
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      ),
    );

    RequestOptions? capturedOptions;
    when(() => mockAdapter.fetch(any(), any(), any())).thenAnswer(
      (invocation) async {
        capturedOptions = invocation.positionalArguments[0] as RequestOptions;
        return ResponseBody.fromString(
          '{"success": true}',
          200,
          headers: {
            Headers.contentTypeHeader: [Headers.jsonContentType],
          },
        );
      },
    );

    final interceptor = container.read(authInterceptorProvider);
    interceptor.dio = parentDio;

    final handler = _CapturingHandler();
    await interceptor.onError(_make401(), handler);

    expect(handler.resolved, isNotNull);
    expect(handler.resolved?.statusCode, equals(200));
    expect(capturedOptions, isNotNull);
    expect(
      capturedOptions!.headers['authorization'],
      equals('Bearer new-access'),
    );
    expect(capturedOptions!.extra['retried'], isTrue);
  });

  test('401 retry uses httpClientAdapter directly when provided', () async {
    final mockAdapter = MockHttpClientAdapter();

    when(() => mockRepo.refresh()).thenAnswer(
      (_) async => const TokenBundle(
        accessToken: 'new-access-2',
        refreshToken: 'new-refresh-2',
      ),
    );

    RequestOptions? capturedOptions;
    when(() => mockAdapter.fetch(any(), any(), any())).thenAnswer(
      (invocation) async {
        capturedOptions = invocation.positionalArguments[0] as RequestOptions;
        return ResponseBody.fromString(
          '{"success": true}',
          200,
          headers: {
            Headers.contentTypeHeader: [Headers.jsonContentType],
          },
        );
      },
    );

    final interceptor = container.read(authInterceptorProvider);
    interceptor.httpClientAdapter = mockAdapter;

    final handler = _CapturingHandler();
    await interceptor.onError(_make401(), handler);

    expect(handler.resolved, isNotNull);
    expect(handler.resolved?.statusCode, equals(200));
    expect(capturedOptions, isNotNull);
    expect(
      capturedOptions!.headers['authorization'],
      equals('Bearer new-access-2'),
    );
    expect(capturedOptions!.extra['retried'], isTrue);
  });

  test('onRequest injects authorization bearer token when available', () async {
    final interceptor = container.read(authInterceptorProvider);
    final options = RequestOptions(path: '/api/v1/users');
    final handler = RequestInterceptorHandler();

    await interceptor.onRequest(options, handler);

    expect(options.headers['authorization'], equals('Bearer old-access'));
  });
}
