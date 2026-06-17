import 'dart:io' show Platform;

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/app/router.dart';
import 'package:mobile_app/features/auth/presentation/auth_controller.dart';
import 'package:mobile_app/features/notifications/data/notifications_repository.dart';
import 'package:super_template_api/super_template_api.dart';

final pushNotificationServiceProvider = Provider<PushNotificationService>(
  (ref) => PushNotificationService(ref),
);

class PushNotificationService {
  PushNotificationService(this._ref);

  final Ref _ref;
  String? _currentToken;
  bool _firebaseReady = false;

  Future<void> initialize() async {
    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp();
      }
      _firebaseReady = true;
    } catch (_) {
      return;
    }

    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission();

    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    messaging.onTokenRefresh.listen((token) => _registerToken(token));

    _ref.listen<AsyncValue<dynamic>>(authControllerProvider, (previous, next) {
      final wasAuthed = previous?.valueOrNull?.isAuthenticated ?? false;
      final isAuthed = next.valueOrNull?.isAuthenticated ?? false;
      if (!wasAuthed && isAuthed) {
        _syncToken();
      }
    });

    if (_ref.read(authControllerProvider).valueOrNull?.isAuthenticated ??
        false) {
      await _syncToken();
    }
  }

  Future<void> unregisterDevice() async {
    final token = _currentToken;
    if (token == null) {
      return;
    }
    try {
      await _ref.read(notificationsRepositoryProvider).unregisterDevice(token);
    } catch (_) {
      // Logout must proceed even when unregister fails.
    } finally {
      _currentToken = null;
    }
  }

  Future<void> _syncToken() async {
    if (!_firebaseReady) {
      return;
    }
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await _registerToken(token);
      }
    } catch (_) {
      // FCM may be unavailable in simulators without Firebase config.
    }
  }

  Future<void> _registerToken(String token) async {
    if (!_firebaseReady) {
      return;
    }
    _currentToken = token;
    try {
      await _ref
          .read(notificationsRepositoryProvider)
          .registerDevice(
            token: token,
            platform: Platform.isIOS
                ? RegisterDeviceDtoPlatformEnum.IOS
                : RegisterDeviceDtoPlatformEnum.ANDROID,
          );
    } catch (_) {
      // Registration is best-effort; inbox still works without push.
    }
  }

  void _handleForegroundMessage(RemoteMessage message) {
    final context = rootNavigatorKey.currentContext;
    if (context == null || !context.mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message.notification?.title ?? 'New notification'),
        action: SnackBarAction(
          label: 'Open',
          onPressed: () => context.go('/notifications'),
        ),
      ),
    );
  }
}

/// Wires push initialization once Riverpod is available.
class PushNotificationListener extends ConsumerStatefulWidget {
  const PushNotificationListener({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<PushNotificationListener> createState() =>
      _PushNotificationListenerState();
}

class _PushNotificationListenerState
    extends ConsumerState<PushNotificationListener> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(pushNotificationServiceProvider).initialize();
    });
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
