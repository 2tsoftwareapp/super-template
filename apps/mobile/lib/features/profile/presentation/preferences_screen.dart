import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/errors/app_exception.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:super_template_api/super_template_api.dart';

final preferencesRepositoryProvider = Provider<PreferencesRepository>(
  (ref) => PreferencesRepository(ref.watch(apiClientProvider)),
);

class PreferencesRepository {
  PreferencesRepository(this._client);

  final SuperTemplateApi _client;

  Future<Map<String, dynamic>> getPreferences() async {
    try {
      final response = await _client.dio.get<Map<String, dynamic>>(
        '/api/v1/users/me/preferences',
      );
      return response.data?['data'] as Map<String, dynamic>? ?? {};
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> updatePreferences(Map<String, dynamic> values) async {
    try {
      await _client.dio.patch<Map<String, dynamic>>(
        '/api/v1/users/me/preferences',
        data: values,
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }
}

class PreferencesScreen extends ConsumerStatefulWidget {
  const PreferencesScreen({super.key});

  @override
  ConsumerState<PreferencesScreen> createState() => _PreferencesScreenState();
}

class _PreferencesScreenState extends ConsumerState<PreferencesScreen> {
  String _theme = 'system';
  String _language = 'en';
  String _timezone = 'UTC';

  @override
  Widget build(BuildContext context) {
    final repository = ref.read(preferencesRepositoryProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Preferences')),
      body: FutureBuilder<Map<String, dynamic>>(
        future: repository.getPreferences(),
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }

          final data = snapshot.data ?? {};
          _theme = data['theme'] as String? ?? _theme;
          _language = data['language'] as String? ?? _language;
          _timezone = data['timezone'] as String? ?? _timezone;

          return Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                TextField(
                  decoration: const InputDecoration(labelText: 'Language'),
                  controller: TextEditingController(text: _language),
                  onChanged: (value) => _language = value,
                ),
                const SizedBox(height: 12),
                TextField(
                  decoration: const InputDecoration(labelText: 'Timezone'),
                  controller: TextEditingController(text: _timezone),
                  onChanged: (value) => _timezone = value,
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: () async {
                    await repository.updatePreferences({
                      'theme': _theme,
                      'language': _language,
                      'timezone': _timezone,
                    });
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
