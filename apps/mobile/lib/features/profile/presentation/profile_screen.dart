import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/design/app_spacing.dart';
import 'package:mobile_app/core/widgets/widgets.dart';
import 'package:mobile_app/features/auth/presentation/auth_controller.dart';
import 'package:mobile_app/features/profile/data/profile_repository.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  late final TextEditingController _displayNameController;
  late final TextEditingController _avatarController;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final session = ref.read(authControllerProvider).valueOrNull;
    _displayNameController = TextEditingController(
      text: session?.displayName ?? '',
    );
    _avatarController = TextEditingController();
  }

  @override
  void dispose() {
    _displayNameController.dispose();
    _avatarController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ref
          .read(profileRepositoryProvider)
          .updateProfile(
            displayName: _displayNameController.text.trim(),
            avatarUrl: _avatarController.text.trim().isEmpty
                ? null
                : _avatarController.text.trim(),
          );
      await ref.read(authControllerProvider.notifier).refreshSession();
      if (mounted) showSuccessSnackBar(context, 'Profile updated');
    } catch (e) {
      if (mounted) showErrorSnackBar(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.xl),
        children: [
          AppTextField(
            controller: _displayNameController,
            label: 'Display name',
            prefixIcon: Icons.person_outline_rounded,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: AppSpacing.base),
          AppTextField(
            controller: _avatarController,
            label: 'Avatar URL',
            hint: 'https://…',
            prefixIcon: Icons.image_outlined,
            keyboardType: TextInputType.url,
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _save(),
          ),
          const SizedBox(height: AppSpacing.xl),
          AppButton(label: 'Save profile', loading: _saving, onPressed: _save),
        ],
      ),
    );
  }
}
