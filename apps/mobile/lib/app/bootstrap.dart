import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/app/app.dart';
import 'package:mobile_app/core/push/push_notification_service.dart';
import 'package:mobile_app/core/storage/theme_store.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<void> bootstrap() async {
  WidgetsFlutterBinding.ensureInitialized();
  final preferences = await SharedPreferences.getInstance();
  runApp(
    ProviderScope(
      overrides: [
        themeStoreProvider.overrideWithValue(ThemeStore(preferences)),
      ],
      child: const PushNotificationListener(child: StarterApp()),
    ),
  );
}
