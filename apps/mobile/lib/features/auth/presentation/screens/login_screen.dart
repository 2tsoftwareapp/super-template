import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:mobile_app/core/design/app_colors.dart';
import 'package:mobile_app/core/design/app_radius.dart';
import 'package:mobile_app/core/design/app_spacing.dart';
import 'package:mobile_app/core/errors/app_exception.dart';
import 'package:mobile_app/core/widgets/widgets.dart';
import 'package:mobile_app/features/auth/data/auth_repository.dart';
import 'package:mobile_app/features/auth/presentation/auth_controller.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  // Pre-filled with seed credentials for local development convenience.
  final _emailController = TextEditingController(text: 'user@example.local');
  final _passwordController = TextEditingController(text: 'ChangeMe123!');
  final _mfaCodeController = TextEditingController();

  bool _obscurePassword = true;
  bool _ssoLoading = false;
  String? _mfaToken;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _mfaCodeController.dispose();
    super.dispose();
  }

  // ── MFA dialog ────────────────────────────────────────────────────────

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
            Text(
              'Enter the 6-digit code from your authenticator app.',
              style: Theme.of(ctx).textTheme.bodyMedium?.copyWith(
                color: Theme.of(ctx).colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            TextField(
              controller: _mfaCodeController,
              decoration: const InputDecoration(
                labelText: 'Authentication code',
                counterText: '',
                prefixIcon: Icon(Icons.lock_clock_outlined),
              ),
              keyboardType: TextInputType.number,
              maxLength: 6,
              autofocus: true,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                letterSpacing: 8,
              ),
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
          _showError('MFA verification failed: $e');
          _showMfaDialog();
        }
      }
    } else {
      setState(() => _mfaToken = null);
    }
  }

  // ── SSO ───────────────────────────────────────────────────────────────

  Future<void> _startSso(String provider) async {
    setState(() => _ssoLoading = true);
    try {
      final url = await ref.read(authRepositoryProvider).startSso(provider);
      await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    } catch (e) {
      if (mounted) _showError('SSO error: $e');
    } finally {
      if (mounted) setState(() => _ssoLoading = false);
    }
  }

  void _showError(String message) {
    showErrorSnackBar(context, message);
  }

  // ── Build ─────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

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
            _showError(error.toString());
          }
        },
      );
    });

    return Scaffold(
      backgroundColor: isDark
          ? AppColors.backgroundDark
          : AppColors.backgroundLight,
      body: SafeArea(
        child: SingleChildScrollView(
          child: ConstrainedBox(
            constraints: BoxConstraints(
              minHeight:
                  MediaQuery.of(context).size.height -
                  MediaQuery.of(context).padding.top -
                  MediaQuery.of(context).padding.bottom,
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.xl,
                vertical: AppSpacing.xl,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: AppSpacing.xl),

                  // ── Brand mark ────────────────────────────────────────
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [cs.primary, cs.secondary],
                      ),
                      borderRadius: AppRadius.lgR,
                      boxShadow: [
                        BoxShadow(
                          color: cs.primary.withValues(alpha: 0.25),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.layers_rounded,
                      color: Colors.white,
                      size: 28,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xxl),

                  // ── Heading ───────────────────────────────────────────
                  Text('Welcome back', style: tt.headlineMedium),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'Sign in to your account to continue.',
                    style: tt.bodyMedium?.copyWith(color: cs.onSurfaceVariant),
                  ),
                  const SizedBox(height: AppSpacing.xxl),

                  // ── Form ──────────────────────────────────────────────
                  Form(
                    key: _formKey,
                    child: Column(
                      children: [
                        TextFormField(
                          key: const Key('login-email'),
                          controller: _emailController,
                          decoration: const InputDecoration(
                            labelText: 'Email address',
                            prefixIcon: Icon(Icons.email_outlined),
                          ),
                          keyboardType: TextInputType.emailAddress,
                          textInputAction: TextInputAction.next,
                          autocorrect: false,
                          validator: (v) => v != null && v.contains('@')
                              ? null
                              : 'Enter a valid email',
                        ),
                        const SizedBox(height: AppSpacing.md),
                        TextFormField(
                          key: const Key('login-password'),
                          controller: _passwordController,
                          decoration: InputDecoration(
                            labelText: 'Password',
                            prefixIcon: const Icon(Icons.lock_outlined),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscurePassword
                                    ? Icons.visibility_outlined
                                    : Icons.visibility_off_outlined,
                              ),
                              onPressed: () => setState(
                                () => _obscurePassword = !_obscurePassword,
                              ),
                              tooltip: _obscurePassword
                                  ? 'Show password'
                                  : 'Hide password',
                            ),
                          ),
                          obscureText: _obscurePassword,
                          textInputAction: TextInputAction.done,
                          onFieldSubmitted: (_) => _submit(authState),
                          validator: (v) => v != null && v.length >= 8
                              ? null
                              : 'Minimum 8 characters',
                        ),

                        // ── Forgot password ──────────────────────────
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: () => context.push('/forgot-password'),
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                horizontal: AppSpacing.xs,
                                vertical: AppSpacing.xs,
                              ),
                            ),
                            child: Text(
                              'Forgot password?',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: cs.primary,
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: AppSpacing.base),

                        // ── Sign in button ───────────────────────────
                        AppButton(
                          key: const Key('login-submit'),
                          label: 'Sign in',
                          loading: authState.isLoading,
                          onPressed: () => _submit(authState),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: AppSpacing.xl),

                  // ── Divider ───────────────────────────────────────────
                  Row(
                    children: [
                      const Expanded(child: Divider()),
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.md,
                        ),
                        child: Text('or continue with', style: tt.labelMedium),
                      ),
                      const Expanded(child: Divider()),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.xl),

                  // ── SSO buttons ───────────────────────────────────────
                  _SsoButton(
                    label: 'Continue with Google',
                    icon: _GoogleIcon(),
                    loading: _ssoLoading,
                    onTap: () => _startSso('google'),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  _SsoButton(
                    label: 'Continue with Apple',
                    icon: const Icon(Icons.apple, size: 20),
                    loading: _ssoLoading,
                    onTap: () => _startSso('apple'),
                  ),

                  const SizedBox(height: AppSpacing.xxl),

                  // ── Footer links ──────────────────────────────────────
                  Center(
                    child: TextButton(
                      onPressed: () => context.push('/register'),
                      child: RichText(
                        text: TextSpan(
                          text: "Don't have an account? ",
                          style: tt.bodySmall?.copyWith(
                            color: cs.onSurfaceVariant,
                          ),
                          children: [
                            TextSpan(
                              text: 'Create one',
                              style: TextStyle(
                                color: cs.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.base),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _submit(AsyncValue<dynamic> authState) {
    if (!_formKey.currentState!.validate()) return;
    ref
        .read(authControllerProvider.notifier)
        .login(_emailController.text.trim(), _passwordController.text);
  }
}

// ── SSO Button ────────────────────────────────────────────────────────────────

class _SsoButton extends StatelessWidget {
  const _SsoButton({
    required this.label,
    required this.icon,
    required this.loading,
    required this.onTap,
  });

  final String label;
  final Widget icon;
  final bool loading;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cs = Theme.of(context).colorScheme;

    return Material(
      color: isDark ? AppColors.surfaceContainerDark : AppColors.surfaceLight,
      borderRadius: AppRadius.mdR,
      child: InkWell(
        onTap: loading ? null : onTap,
        borderRadius: AppRadius.mdR,
        child: Container(
          height: 52,
          decoration: BoxDecoration(
            borderRadius: AppRadius.mdR,
            border: Border.all(
              color: isDark ? AppColors.outlineDark : AppColors.outlineLight,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (loading)
                SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: cs.primary,
                  ),
                )
              else ...[
                icon,
                const SizedBox(width: AppSpacing.sm),
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ── Google SVG Icon ───────────────────────────────────────────────────────────

class _GoogleIcon extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 20,
      height: 20,
      child: CustomPaint(painter: _GooglePainter()),
    );
  }
}

class _GooglePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width / 24;

    // Red
    canvas.drawPath(
      Path()
        ..moveTo(23.52 * s, 12.27 * s)
        ..lineTo(23.52 * s, 12.27 * s)
        ..cubicTo(
          23.52 * s,
          11.46 * s,
          23.45 * s,
          10.68 * s,
          23.32 * s,
          9.94 * s,
        )
        ..lineTo(12 * s, 9.94 * s)
        ..lineTo(12 * s, 14.41 * s)
        ..lineTo(18.54 * s, 14.41 * s)
        ..cubicTo(
          18.24 * s,
          15.91 * s,
          17.35 * s,
          17.19 * s,
          16.05 * s,
          18.04 * s,
        )
        ..lineTo(16.05 * s, 21.02 * s)
        ..lineTo(19.94 * s, 21.02 * s)
        ..cubicTo(
          22.2 * s,
          18.94 * s,
          23.52 * s,
          15.87 * s,
          23.52 * s,
          12.27 * s,
        )
        ..close(),
      Paint()..color = const Color(0xFF4285F4),
    );

    canvas.drawPath(
      Path()
        ..moveTo(12 * s, 24 * s)
        ..cubicTo(15.24 * s, 24 * s, 17.96 * s, 22.92 * s, 19.94 * s, 21.02 * s)
        ..lineTo(16.05 * s, 18.04 * s)
        ..cubicTo(14.99 * s, 18.73 * s, 13.63 * s, 19.14 * s, 12 * s, 19.14 * s)
        ..cubicTo(8.87 * s, 19.14 * s, 6.23 * s, 17.03 * s, 5.3 * s, 14.2 * s)
        ..lineTo(1.28 * s, 14.2 * s)
        ..lineTo(1.28 * s, 17.27 * s)
        ..cubicTo(3.25 * s, 21.16 * s, 7.31 * s, 24 * s, 12 * s, 24 * s)
        ..close(),
      Paint()..color = const Color(0xFF34A853),
    );

    canvas.drawPath(
      Path()
        ..moveTo(5.3 * s, 14.2 * s)
        ..cubicTo(5.06 * s, 13.51 * s, 4.93 * s, 12.77 * s, 4.93 * s, 12 * s)
        ..cubicTo(4.93 * s, 11.23 * s, 5.06 * s, 10.49 * s, 5.3 * s, 9.8 * s)
        ..lineTo(5.3 * s, 6.73 * s)
        ..lineTo(1.28 * s, 6.73 * s)
        ..cubicTo(0.47 * s, 8.34 * s, 0 * s, 10.11 * s, 0 * s, 12 * s)
        ..cubicTo(0, 13.89 * s, 0.47 * s, 15.66 * s, 1.28 * s, 17.27 * s)
        ..lineTo(5.3 * s, 14.2 * s)
        ..close(),
      Paint()..color = const Color(0xFFFBBC05),
    );

    canvas.drawPath(
      Path()
        ..moveTo(12 * s, 4.86 * s)
        ..cubicTo(13.76 * s, 4.86 * s, 15.35 * s, 5.47 * s, 16.6 * s, 6.65 * s)
        ..lineTo(20.02 * s, 3.23 * s)
        ..cubicTo(17.95 * s, 1.28 * s, 15.23 * s, 0, 12 * s, 0)
        ..cubicTo(7.31 * s, 0, 3.25 * s, 2.84 * s, 1.28 * s, 6.73 * s)
        ..lineTo(5.3 * s, 9.8 * s)
        ..cubicTo(6.23 * s, 6.97 * s, 8.87 * s, 4.86 * s, 12 * s, 4.86 * s)
        ..close(),
      Paint()..color = const Color(0xFFEA4335),
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter _) => false;
}
