import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/features/auth/presentation/auth_controller.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _emailController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            TextField(
              controller: _emailController,
              decoration: const InputDecoration(labelText: 'Email'),
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () async {
                final messenger = ScaffoldMessenger.of(context);
                await ref
                    .read(authControllerProvider.notifier)
                    .forgotPassword(_emailController.text.trim());
                messenger.showSnackBar(
                  const SnackBar(
                    content: Text(
                      'If the account exists, a reset email was sent.',
                    ),
                  ),
                );
              },
              child: const Text('Send reset email'),
            ),
          ],
        ),
      ),
    );
  }
}
