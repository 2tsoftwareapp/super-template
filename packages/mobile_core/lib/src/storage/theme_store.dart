import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeStore {
  ThemeStore(this._prefs);

  final SharedPreferences _prefs;
  static const _key = 'theme_mode';

  ThemeMode read() {
    final raw = _prefs.getString(_key);
    return switch (raw) {
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      _ => ThemeMode.system,
    };
  }

  Future<void> write(ThemeMode value) async {
    final raw = switch (value) {
      ThemeMode.light => 'light',
      ThemeMode.dark => 'dark',
      ThemeMode.system => 'system',
    };
    await _prefs.setString(_key, raw);
  }
}

final themeStoreProvider = Provider<ThemeStore>((_) {
  throw UnimplementedError('Override in bootstrap tests or runtime');
});
