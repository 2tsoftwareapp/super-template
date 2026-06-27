import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/widgets/widgets.dart';
import 'package:mobile_app/features/profile/data/mfa_repository.dart';
import 'package:mobile_app/features/profile/data/profile_repository.dart';

final mfaStatusProvider = FutureProvider(
  (ref) => ref.watch(mfaRepositoryProvider).getStatus(),
);

class SecurityScreen extends ConsumerStatefulWidget {
  const SecurityScreen({super.key});

  @override
  ConsumerState<SecurityScreen> createState() => _SecurityScreenState();
}

class _SecurityScreenState extends ConsumerState<SecurityScreen> {
  final _currentController = TextEditingController();
  final _nextController = TextEditingController();
  final _mfaCodeController = TextEditingController();
  final _disableCodeController = TextEditingController();
  final _regenerateCodeController = TextEditingController();

  @override
  void dispose() {
    _currentController.dispose();
    _nextController.dispose();
    _mfaCodeController.dispose();
    _disableCodeController.dispose();
    _regenerateCodeController.dispose();
    super.dispose();
  }

  Future<void> _setupMfa() async {
    final repo = ref.read(mfaRepositoryProvider);
    try {
      final setupInfo = await repo.setup();
      if (!mounted) return;

      _mfaCodeController.clear();
      final code = await showDialog<String>(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          title: const Text('Setup MFA'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Scan the QR code in your authenticator app, or manually enter the secret key below.',
                ),
                const SizedBox(height: 16),
                const Text(
                  'Secret key:',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                SelectableText(
                  setupInfo.secret,
                  style: const TextStyle(fontFamily: 'monospace'),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _mfaCodeController,
                  decoration: const InputDecoration(
                    labelText: 'Enter the 6-digit code',
                    counterText: '',
                  ),
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 24, letterSpacing: 8),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () =>
                  Navigator.of(ctx).pop(_mfaCodeController.text.trim()),
              child: const Text('Confirm'),
            ),
          ],
        ),
      );

      if (code != null && code.length == 6) {
        final recoveryCodes = await repo.confirm(code);
        ref.invalidate(mfaStatusProvider);
        if (mounted) _showRecoveryCodes(recoveryCodes);
      }
    } catch (e) {
      if (mounted) showErrorSnackBar(context, e);
    }
  }

  void _showRecoveryCodes(List<String> codes) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text('Recovery codes'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Store these recovery codes in a safe place. '
              'Each code can be used only once to sign in if you lose access to your authenticator.',
            ),
            const SizedBox(height: 16),
            ...codes.map(
              (c) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Row(
                  children: [
                    const Icon(Icons.fiber_manual_record, size: 8),
                    const SizedBox(width: 8),
                    SelectableText(
                      c,
                      style: const TextStyle(fontFamily: 'monospace'),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        actions: [
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('I saved them'),
          ),
        ],
      ),
    );
  }

  Future<void> _disableMfa() async {
    _disableCodeController.clear();
    final code = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Disable MFA'),
        content: TextField(
          controller: _disableCodeController,
          decoration: const InputDecoration(
            labelText: 'Enter authenticator code',
            counterText: '',
          ),
          keyboardType: TextInputType.number,
          maxLength: 6,
          textAlign: TextAlign.center,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () =>
                Navigator.of(ctx).pop(_disableCodeController.text.trim()),
            child: const Text('Disable'),
          ),
        ],
      ),
    );
    if (code != null && code.length == 6) {
      try {
        await ref.read(mfaRepositoryProvider).disable(code);
        ref.invalidate(mfaStatusProvider);
        if (mounted) showSuccessSnackBar(context, 'MFA disabled');
      } catch (e) {
        if (mounted) showErrorSnackBar(context, e);
      }
    }
  }

  Future<void> _regenerateCodes() async {
    _regenerateCodeController.clear();
    final code = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Regenerate recovery codes'),
        content: TextField(
          controller: _regenerateCodeController,
          decoration: const InputDecoration(
            labelText: 'Enter authenticator code',
            counterText: '',
          ),
          keyboardType: TextInputType.number,
          maxLength: 6,
          textAlign: TextAlign.center,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () =>
                Navigator.of(ctx).pop(_regenerateCodeController.text.trim()),
            child: const Text('Regenerate'),
          ),
        ],
      ),
    );
    if (code != null && code.length == 6) {
      try {
        final codes = await ref
            .read(mfaRepositoryProvider)
            .regenerateRecoveryCodes(code);
        if (mounted) _showRecoveryCodes(codes);
      } catch (e) {
        if (mounted) showErrorSnackBar(context, e);
      }
    }
  }

  Future<void> _changePassword() async {
    try {
      await ref
          .read(profileRepositoryProvider)
          .changePassword(
            currentPassword: _currentController.text,
            newPassword: _nextController.text,
          );
      _currentController.clear();
      _nextController.clear();
      if (mounted) showSuccessSnackBar(context, 'Password updated');
    } catch (e) {
      if (mounted) showErrorSnackBar(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final mfaStatus = ref.watch(mfaStatusProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Security')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text('Password', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          AppTextField(
            controller: _currentController,
            label: 'Current password',
            obscure: true,
            prefixIcon: Icons.lock_outline_rounded,
          ),
          const SizedBox(height: 16),
          AppTextField(
            controller: _nextController,
            label: 'New password',
            obscure: true,
            prefixIcon: Icons.lock_reset_rounded,
          ),
          const SizedBox(height: 16),
          AppButton(label: 'Update password', onPressed: _changePassword),
          const SizedBox(height: 32),
          Text(
            'Two-factor authentication',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          mfaStatus.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Text('Error: $e'),
            data: (enabled) {
              if (enabled) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.check_circle, color: Colors.green),
                        SizedBox(width: 8),
                        Text('MFA is enabled'),
                      ],
                    ),
                    const SizedBox(height: 12),
                    AppButton(
                      label: 'Disable MFA',
                      variant: AppButtonVariant.outline,
                      onPressed: _disableMfa,
                    ),
                    const SizedBox(height: 8),
                    AppButton(
                      label: 'Regenerate recovery codes',
                      variant: AppButtonVariant.outline,
                      onPressed: _regenerateCodes,
                    ),
                  ],
                );
              }
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('MFA is not enabled.'),
                  const SizedBox(height: 12),
                  AppButton(label: 'Enable MFA', onPressed: _setupMfa),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}
