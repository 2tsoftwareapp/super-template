import 'package:flutter/material.dart';
import 'package:mobile_core/src/design/app_radius.dart';
import 'package:mobile_core/src/design/app_spacing.dart';
import 'package:mobile_core/src/errors/user_facing_error.dart';

// ─────────────────────────────────────────────────────────────────────────────
// CenterMessage — empty / error / info states
// ─────────────────────────────────────────────────────────────────────────────

class CenterMessage extends StatelessWidget {
  const CenterMessage({
    required this.title,
    this.body,
    this.action,
    this.icon,
    this.iconColor,
    super.key,
  });

  final String title;
  final String? body;
  final Widget? action;
  final IconData? icon;
  final Color? iconColor;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.xxl,
          vertical: AppSpacing.xl,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: (iconColor ?? cs.primary).withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 28, color: iconColor ?? cs.primary),
              ),
              const SizedBox(height: AppSpacing.base),
            ],
            Text(title, style: tt.titleLarge, textAlign: TextAlign.center),
            if (body != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(
                body!,
                style: tt.bodyMedium?.copyWith(color: cs.onSurfaceVariant),
                textAlign: TextAlign.center,
              ),
            ],
            if (action != null) ...[
              const SizedBox(height: AppSpacing.xl),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AppErrorView — actionable error with retry
// ─────────────────────────────────────────────────────────────────────────────

class AppErrorView extends StatelessWidget {
  const AppErrorView({required this.error, this.onRetry, super.key});

  final Object error;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final message = userFacingErrorMessage(error);
    return CenterMessage(
      icon: Icons.error_outline_rounded,
      iconColor: cs.error,
      title: 'Something went wrong',
      body: message.length > 120 ? '${message.substring(0, 120)}…' : message,
      action: onRetry != null
          ? OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('Try again'),
              style: OutlinedButton.styleFrom(minimumSize: const Size(160, 44)),
            )
          : null,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SkeletonBox — shimmer-style loading placeholder
// ─────────────────────────────────────────────────────────────────────────────

class SkeletonBox extends StatefulWidget {
  const SkeletonBox({
    this.width,
    this.height = 16,
    this.radius,
    this.isCircle = false,
    super.key,
  });

  final double? width;
  final double height;
  final double? radius;
  final bool isCircle;

  @override
  State<SkeletonBox> createState() => _SkeletonBoxState();
}

class _SkeletonBoxState extends State<SkeletonBox>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _anim = CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final baseColor = isDark
        ? const Color(0xFF293548)
        : const Color(0xFFE2E8F0);
    final shineColor = isDark
        ? const Color(0xFF334155)
        : const Color(0xFFF1F5F9);

    return AnimatedBuilder(
      animation: _anim,
      builder: (context, child) => Container(
        width: widget.width,
        height: widget.isCircle ? widget.width : widget.height,
        decoration: BoxDecoration(
          shape: widget.isCircle ? BoxShape.circle : BoxShape.rectangle,
          borderRadius: widget.isCircle
              ? null
              : BorderRadius.circular(widget.radius ?? AppRadius.sm),
          color: Color.lerp(baseColor, shineColor, _anim.value),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SkeletonListTile — placeholder for list items while loading
// ─────────────────────────────────────────────────────────────────────────────

class SkeletonListTile extends StatelessWidget {
  const SkeletonListTile({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.base,
        vertical: AppSpacing.sm,
      ),
      child: Row(
        children: [
          SkeletonBox(width: 44, height: 44, radius: AppRadius.md),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonBox(width: double.infinity, height: 14),
                const SizedBox(height: AppSpacing.xs),
                SkeletonBox(width: 120, height: 12),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SkeletonCard — placeholder for cards while loading
// ─────────────────────────────────────────────────────────────────────────────

class SkeletonCard extends StatelessWidget {
  const SkeletonCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: AppRadius.lgR,
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
        color: Theme.of(context).colorScheme.surface,
      ),
      padding: const EdgeInsets.all(AppSpacing.base),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SkeletonBox(width: 40, height: 40, radius: AppRadius.md),
          const SizedBox(height: AppSpacing.md),
          const SkeletonBox(width: double.infinity, height: 14),
          const SizedBox(height: AppSpacing.xs),
          SkeletonBox(width: 80, height: 12),
        ],
      ),
    );
  }
}
