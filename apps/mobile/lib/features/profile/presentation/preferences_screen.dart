import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/features/profile/data/preferences_repository.dart';

final preferencesProvider = FutureProvider(
  (ref) => ref.watch(preferencesRepositoryProvider).getPreferences(),
);

class PreferencesScreen extends ConsumerStatefulWidget {
  const PreferencesScreen({super.key});

  @override
  ConsumerState<PreferencesScreen> createState() => _PreferencesScreenState();
}

class _PreferencesScreenState extends ConsumerState<PreferencesScreen> {
  final _languageController = TextEditingController();
  final _timezoneController = TextEditingController();
  String _theme = 'system';
  bool _initialized = false;

  @override
  void dispose() {
    _languageController.dispose();
    _timezoneController.dispose();
    super.dispose();
  }

  void _applyPreferences(UserPreferences prefs) {
    if (_initialized) {
      return;
    }
    _theme = prefs.theme;
    _languageController.text = prefs.language;
    _timezoneController.text = prefs.timezone;
    _initialized = true;
  }

  @override
  Widget build(BuildContext context) {
    final prefsAsync = ref.watch(preferencesProvider);
    final repository = ref.read(preferencesRepositoryProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Preferences')),
      body: prefsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text(error.toString())),
        data: (prefs) {
          _applyPreferences(prefs);
          return Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                DropdownButtonFormField<String>(
                  initialValue: _theme,
                  decoration: const InputDecoration(labelText: 'Theme'),
                  items: const [
                    DropdownMenuItem(value: 'system', child: Text('System')),
                    DropdownMenuItem(value: 'light', child: Text('Light')),
                    DropdownMenuItem(value: 'dark', child: Text('Dark')),
                  ],
                  onChanged: (value) =>
                      setState(() => _theme = value ?? 'system'),
                ),
                const SizedBox(height: 12),
                TextField(
                  decoration: const InputDecoration(labelText: 'Language'),
                  controller: _languageController,
                ),
                const SizedBox(height: 12),
                TextField(
                  decoration: const InputDecoration(labelText: 'Timezone'),
                  controller: _timezoneController,
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: () async {
                    await repository.updatePreferences(
                      theme: _theme,
                      language: _languageController.text.trim(),
                      timezone: _timezoneController.text.trim(),
                    );
                    ref.invalidate(preferencesProvider);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Preferences saved')),
                      );
                    }
                  },
                  child: const Text('Save preferences'),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
