import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/features/auth/presentation/auth_controller.dart';
import 'package:mobile_app/features/profile/data/profile_repository.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  late final TextEditingController _displayNameController;
  final _avatarController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final displayName =
        ref.read(authControllerProvider).valueOrNull?.displayName ?? '';
    _displayNameController = TextEditingController(text: displayName);
  }

  @override
  void dispose() {
    _displayNameController.dispose();
    _avatarController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            TextField(
              controller: _displayNameController,
              decoration: const InputDecoration(labelText: 'Display name'),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _avatarController,
              decoration: const InputDecoration(labelText: 'Avatar URL'),
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () async {
                final messenger = ScaffoldMessenger.of(context);
                await ref
                    .read(profileRepositoryProvider)
                    .updateProfile(
                      displayName: _displayNameController.text.trim(),
                      avatarUrl: _avatarController.text.trim().isEmpty
                          ? null
                          : _avatarController.text.trim(),
                    );
                messenger.showSnackBar(
                  const SnackBar(content: Text('Profile updated')),
                );
              },
              child: const Text('Save profile'),
            ),
          ],
        ),
      ),
    );
  }
}
