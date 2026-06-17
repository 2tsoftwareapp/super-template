import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/features/admin/data/admin_repository.dart';
import 'package:mobile_app/features/auth/presentation/auth_controller.dart';

class AdminSettingsScreen extends ConsumerStatefulWidget {
  const AdminSettingsScreen({super.key});

  @override
  ConsumerState<AdminSettingsScreen> createState() =>
      _AdminSettingsScreenState();
}

class _AdminSettingsScreenState extends ConsumerState<AdminSettingsScreen> {
  int _refreshKey = 0;

  @override
  Widget build(BuildContext context) {
    final permissions =
        ref.watch(authControllerProvider).valueOrNull?.permissions ?? [];
    final canRead = permissions.contains('settings.read');
    final canManage = permissions.contains('settings.manage');

    if (!canRead) {
      return Scaffold(
        appBar: AppBar(title: const Text('Settings')),
        body: const Center(child: Text('Missing settings.read permission')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        actions: [
          IconButton(
            onPressed: () => setState(() => _refreshKey++),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: FutureBuilder(
        key: ValueKey(_refreshKey),
        future: ref.read(adminRepositoryProvider).listSettings(),
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text(snapshot.error.toString()));
          }
          final settings = snapshot.data ?? [];
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: settings.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final setting = settings[index];
              return ListTile(
                title: Text(setting.key),
                subtitle: Text(setting.valueJson),
                trailing: canManage
                    ? IconButton(
                        icon: const Icon(Icons.edit),
                        onPressed: () => _editSetting(context, setting.key),
                      )
                    : null,
              );
            },
          );
        },
      ),
    );
  }

  Future<void> _editSetting(BuildContext context, String key) async {
    final controller = TextEditingController();
    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Update $key'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(labelText: 'Value'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              await ref
                  .read(adminRepositoryProvider)
                  .updateSetting(key: key, value: {'value': controller.text});
              if (context.mounted) {
                Navigator.pop(context);
                setState(() => _refreshKey++);
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}
