import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/app/theme.dart';
import 'package:mobile_app/features/profile/data/preferences_repository.dart';

final preferencesProvider = FutureProvider(
  (ref) => ref.watch(preferencesRepositoryProvider).getPreferences(),
);

const _timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland',
];

class PreferencesScreen extends ConsumerStatefulWidget {
  const PreferencesScreen({super.key});

  @override
  ConsumerState<PreferencesScreen> createState() => _PreferencesScreenState();
}

class _PreferencesScreenState extends ConsumerState<PreferencesScreen> {
  late UserPreferences _prefs;
  bool _initialized = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _prefs = UserPreferences.defaults;
  }

  void _apply(UserPreferences p) {
    if (_initialized) return;
    _prefs = p;
    _initialized = true;
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ref.read(preferencesRepositoryProvider).updatePreferences(_prefs);
      ref.read(themeModeProvider.notifier).setTheme(_prefs.theme);
      ref.invalidate(preferencesProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context)
          ..clearSnackBars()
          ..showSnackBar(const SnackBar(content: Text('Preferences saved')));
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
          ..clearSnackBars()
          ..showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _reset() async {
    final defaults = UserPreferences.defaults;
    setState(() => _prefs = defaults);
    try {
      await ref.read(preferencesRepositoryProvider).updatePreferences(defaults);
      ref.read(themeModeProvider.notifier).setTheme(defaults.theme);
      ref.invalidate(preferencesProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context)
          ..clearSnackBars()
          ..showSnackBar(const SnackBar(content: Text('Reset to defaults')));
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
          ..clearSnackBars()
          ..showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(preferencesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Preferences')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
        data: (p) {
          _apply(p);
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              DropdownButtonFormField<String>(
                value: _prefs.theme,
                decoration: const InputDecoration(labelText: 'Theme'),
                items: const [
                  DropdownMenuItem(value: 'system', child: Text('System')),
                  DropdownMenuItem(value: 'light', child: Text('Light')),
                  DropdownMenuItem(value: 'dark', child: Text('Dark')),
                ],
                onChanged: (v) => setState(() => _prefs = _prefs.copyWith(theme: v)),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _prefs.language,
                decoration: const InputDecoration(labelText: 'Language'),
                items: const [
                  DropdownMenuItem(value: 'en', child: Text('English')),
                  DropdownMenuItem(value: 'vi', child: Text('Vietnamese')),
                ],
                onChanged: (v) => setState(() => _prefs = _prefs.copyWith(language: v)),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _timezones.contains(_prefs.timezone)
                    ? _prefs.timezone
                    : 'UTC',
                decoration: const InputDecoration(labelText: 'Timezone'),
                items: _timezones
                    .map((tz) => DropdownMenuItem(value: tz, child: Text(tz)))
                    .toList(),
                onChanged: (v) => setState(() => _prefs = _prefs.copyWith(timezone: v)),
              ),
              const SizedBox(height: 24),
              Text('Notifications', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              SwitchListTile(
                title: const Text('Email notifications'),
                value: _prefs.notificationEmail,
                onChanged: (v) =>
                    setState(() => _prefs = _prefs.copyWith(notificationEmail: v)),
              ),
              SwitchListTile(
                title: const Text('Push notifications'),
                value: _prefs.notificationPush,
                onChanged: (v) =>
                    setState(() => _prefs = _prefs.copyWith(notificationPush: v)),
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _saving ? null : _save,
                child: Text(_saving ? 'Saving...' : 'Save preferences'),
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: _reset,
                child: const Text('Reset to defaults'),
              ),
            ],
          );
        },
      ),
    );
  }
}
