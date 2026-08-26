import 'package:flutter/material.dart';
import 'package:mobile_core/src/design/app_colors.dart';
import 'package:mobile_core/src/design/app_radius.dart';
import 'package:mobile_core/src/design/app_spacing.dart';

enum AppAlertTone { info, success, warning, danger }

/// Inline alert banner for surfacing contextual messages.
///
/// ```dart
/// AppAlert(
///   tone: AppAlertTone.warning,
///   title: 'Heads up',
///   message: 'Your trial ends in 3 days.',
/// )
/// ```
class AppAlert extends StatelessWidget {
  const AppAlert({
    required this.message,
    this.title,
    this.tone = AppAlertTone.info,
    this.icon,
    this.onClose,
    this.action,
    super.key,
  });

  final String message;
  final String? title;
  final AppAlertTone tone;
  final IconData? icon;
  final VoidCallback? onClose;
  final Widget? action;

  ({Color fg, Color bg, IconData icon}) _resolve() {
    return switch (tone) {
      AppAlertTone.info => (
        fg: AppColors.secondary,
        bg: AppColors.secondary.withValues(alpha: 0.10),
        icon: Icons.info_outline_rounded,
      ),
      AppAlertTone.success => (
        fg: AppColors.accent,
        bg: AppColors.accent.withValues(alpha: 0.10),
        icon: Icons.check_circle_outline_rounded,
      ),
      AppAlertTone.warning => (
        fg: AppColors.warning,
        bg: AppColors.warning.withValues(alpha: 0.12),
        icon: Icons.warning_amber_rounded,
      ),
      AppAlertTone.danger => (
        fg: AppColors.error,
        bg: AppColors.error.withValues(alpha: 0.10),
        icon: Icons.error_outline_rounded,
      ),
    };
  }

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;
    final c = _resolve();

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: c.bg,
        borderRadius: AppRadius.mdR,
        border: Border.all(color: c.fg.withValues(alpha: 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon ?? c.icon, color: c.fg, size: 20),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (title != null) ...[
                  Text(
                    title!,
                    style: tt.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: c.fg,
                    ),
                  ),
                  const SizedBox(height: 2),
                ],
                Text(
                  message,
                  style: tt.bodyMedium?.copyWith(color: cs.onSurface),
                ),
                if (action != null) ...[
                  const SizedBox(height: AppSpacing.sm),
                  action!,
                ],
              ],
            ),
          ),
          if (onClose != null)
            GestureDetector(
              onTap: onClose,
              child: Icon(
                Icons.close_rounded,
                size: 18,
                color: c.fg.withValues(alpha: 0.7),
              ),
            ),
        ],
      ),
    );
  }
}
