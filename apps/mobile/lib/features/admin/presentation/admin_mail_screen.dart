import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/features/admin/data/admin_repository.dart';
import 'package:mobile_app/features/auth/presentation/auth_controller.dart';

class AdminMailScreen extends ConsumerStatefulWidget {
  const AdminMailScreen({super.key});

  @override
  ConsumerState<AdminMailScreen> createState() => _AdminMailScreenState();
}

class _AdminMailScreenState extends ConsumerState<AdminMailScreen> {
  final _templateController = TextEditingController(text: 'welcome');

  @override
  void dispose() {
    _templateController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final canRead =
        ref
            .watch(authControllerProvider)
            .valueOrNull
            ?.permissions
            .contains('mail.read') ??
        false;

    if (!canRead) {
      return Scaffold(
        appBar: AppBar(title: const Text('Mail')),
        body: const Center(child: Text('Missing mail.read permission')),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Mail deliveries')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _previewTemplate(context),
        child: const Icon(Icons.preview),
      ),
      body: FutureBuilder(
        future: ref.read(adminRepositoryProvider).listMailDeliveries(),
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text(snapshot.error.toString()));
          }
          final deliveries = snapshot.data ?? [];
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: deliveries.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final delivery = deliveries[index];
              return ListTile(
                title: Text(delivery.subject),
                subtitle: Text(
                  '${delivery.templateKey} → ${delivery.recipient}',
                ),
                trailing: Text(delivery.status),
              );
            },
          );
        },
      ),
    );
  }

  Future<void> _previewTemplate(BuildContext context) async {
    final templateKey = _templateController.text.trim();
    if (templateKey.isEmpty) {
      return;
    }
    final html = await ref
        .read(adminRepositoryProvider)
        .previewMail(templateKey);
    if (!context.mounted) {
      return;
    }
    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Preview: $templateKey'),
        content: SingleChildScrollView(child: Text(html)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}
