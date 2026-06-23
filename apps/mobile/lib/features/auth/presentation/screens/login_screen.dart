import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:mobile_app/core/errors/app_exception.dart';
import 'package:mobile_app/features/auth/data/auth_repository.dart';
import 'package:mobile_app/features/auth/presentation/auth_controller.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController(text: 'user@example.local');
  final _passwordController = TextEditingController(text: 'ChangeMe123!');
  final _mfaCodeController = TextEditingController();
  bool _ssoLoading = false;
  String? _mfaToken;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _mfaCodeController.dispose();
    super.dispose();
  }



  Future<void> _showMfaDialog() async {
    _mfaCodeController.clear();
    final code = await showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text('Two-factor authentication'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Enter the 6-digit code from your authenticator app.'),
            const SizedBox(height: 16),
            TextField(
              controller: _mfaCodeController,
              decoration: const InputDecoration(
                labelText: 'Authentication code',
                counterText: '',
              ),
              keyboardType: TextInputType.number,
              maxLength: 6,
              autofocus: true,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 24, letterSpacing: 8),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () =>
                Navigator.of(ctx).pop(_mfaCodeController.text.trim()),
            child: const Text('Verify'),
          ),
        ],
      ),
    );

    if (code != null && code.length == 6 && mounted && _mfaToken != null) {
      try {
        await ref
            .read(authControllerProvider.notifier)
            .verifyMfaChallenge(mfaToken: _mfaToken!, code: code);
        if (mounted) context.go('/home');
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context)
            ..clearSnackBars()
            ..showSnackBar(SnackBar(content: Text('MFA error: $e')));
          _showMfaDialog();
        }
      }
    } else {
      setState(() => _mfaToken = null);
    }
  }

  Future<void> _startSso(String provider) async {
    setState(() => _ssoLoading = true);
    try {
      final repo = ref.read(authRepositoryProvider);
      final url = await repo.startSso(provider);
      await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
          ..clearSnackBars()
          ..showSnackBar(SnackBar(content: Text('SSO error: $e')));
      }
    } finally {
      if (mounted) setState(() => _ssoLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);

    ref.listen(authControllerProvider, (_, next) {
      next.whenOrNull(
        data: (session) {
          if (session != null && mounted && _mfaToken == null) {
            context.go('/home');
          }
        },
        error: (error, _) {
          if (error is MfaRequiredException) {
            setState(() => _mfaToken = error.mfaToken);
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) _showMfaDialog();
            });
          } else if (mounted) {
            ScaffoldMessenger.of(context)
              ..clearSnackBars()
              ..showSnackBar(SnackBar(content: Text(error.toString())));
          }
        },
      );
    });

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Sign in',
                        style: Theme.of(context).textTheme.headlineLarge,
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Use the seeded development account or your own user.',
                      ),
                      const SizedBox(height: 24),
                      TextFormField(
                        key: const Key('login-email'),
                        controller: _emailController,
                        decoration:
                            const InputDecoration(labelText: 'Email'),
                        validator: (value) =>
                            value != null && value.contains('@')
                                ? null
                                : 'Enter a valid email',
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        key: const Key('login-password'),
                        controller: _passwordController,
                        decoration:
                            const InputDecoration(labelText: 'Password'),
                        obscureText: true,
                        validator: (value) => value != null && value.length >= 8
                            ? null
                            : 'Minimum 8 characters',
                      ),
                      const SizedBox(height: 24),
                      FilledButton(
                        key: const Key('login-submit'),
                        onPressed: authState.isLoading
                            ? null
                            : () async {
                                if (!_formKey.currentState!.validate()) {
                                  return;
                                }
                                await ref
                                    .read(authControllerProvider.notifier)
                                    .login(
                                      _emailController.text.trim(),
                                      _passwordController.text,
                                    );
                              },
                        child: Text(
                          authState.isLoading
                              ? 'Signing in...'
                              : 'Sign in',
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Row(
                        children: [
                          Expanded(child: Divider()),
                          Padding(
                            padding: EdgeInsets.symmetric(horizontal: 12),
                            child: Text('or'),
                          ),
                          Expanded(child: Divider()),
                        ],
                      ),
                      const SizedBox(height: 16),
                      OutlinedButton.icon(
                        onPressed: _ssoLoading
                            ? null
                            : () => _startSso('google'),
                        icon: const Icon(Icons.login),
                        label: const Text('Sign in with Google'),
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: _ssoLoading
                            ? null
                            : () => _startSso('apple'),
                        icon: const Icon(Icons.apple),
                        label: const Text('Sign in with Apple'),
                      ),
                      const SizedBox(height: 16),
                      TextButton(
                        onPressed: () => context.go('/register'),
                        child: const Text('Create account'),
                      ),
                      TextButton(
                        onPressed: () => context.go('/forgot-password'),
                        child: const Text('Forgot password'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
