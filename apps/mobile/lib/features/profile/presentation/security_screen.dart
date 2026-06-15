import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/features/profile/data/profile_repository.dart';

class SecurityScreen extends ConsumerStatefulWidget {
  const SecurityScreen({super.key});

  @override
  ConsumerState<SecurityScreen> createState() => _SecurityScreenState();
}

class _SecurityScreenState extends ConsumerState<SecurityScreen> {
  final _currentController = TextEditingController();
  final _nextController = TextEditingController();

  @override
  void dispose() {
    _currentController.dispose();
    _nextController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Security')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            TextField(
              controller: _currentController,
              decoration: const InputDecoration(labelText: 'Current password'),
              obscureText: true,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _nextController,
              decoration: const InputDecoration(labelText: 'New password'),
              obscureText: true,
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () async {
                final messenger = ScaffoldMessenger.of(context);
                await ref
                    .read(profileRepositoryProvider)
                    .changePassword(
                      currentPassword: _currentController.text,
                      newPassword: _nextController.text,
                    );
                messenger.showSnackBar(
                  const SnackBar(content: Text('Password updated')),
                );
              },
              child: const Text('Update password'),
            ),
          ],
        ),
      ),
    );
  }
}
