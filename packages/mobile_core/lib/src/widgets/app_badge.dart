import 'package:flutter/material.dart';
import 'package:mobile_core/src/design/app_colors.dart';
import 'package:mobile_core/src/design/app_radius.dart';

enum AppBadgeTone { neutral, primary, success, warning, danger, info }

/// Small pill-shaped label for statuses, roles, counts, etc.
class AppBadge extends StatelessWidget {
  const AppBadge({
    required this.label,
    this.tone = AppBadgeTone.neutral,
    this.icon,
    super.key,
  });

  /// Maps a backend status string to a sensible tone + label.
  factory AppBadge.status(String status, {Key? key}) {
    final normalized = status.toUpperCase();
    final tone = switch (normalized) {
      'ACTIVE' || 'COMPLETED' || 'SUCCESS' || 'DONE' => AppBadgeTone.success,
      'PENDING' || 'PROCESSING' || 'IN_PROGRESS' => AppBadgeTone.warning,
      'BLOCKED' || 'FAILED' || 'ERROR' || 'ARCHIVED' => AppBadgeTone.danger,
      'DRAFT' => AppBadgeTone.info,
      _ => AppBadgeTone.neutral,
    };
    return AppBadge(label: normalized, tone: tone, key: key);
  }

  final String label;
  final AppBadgeTone tone;
  final IconData? icon;

  ({Color fg, Color bg}) _colors(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final muted = isDark
        ? AppColors.onSurfaceMutedDark
        : AppColors.onSurfaceMutedLight;
    return switch (tone) {
      AppBadgeTone.neutral => (fg: muted, bg: muted.withValues(alpha: 0.12)),
      AppBadgeTone.primary => (
        fg: AppColors.primary,
        bg: AppColors.primary.withValues(alpha: 0.12),
      ),
      AppBadgeTone.success => (
        fg: AppColors.accent,
        bg: AppColors.accent.withValues(alpha: 0.12),
      ),
      AppBadgeTone.warning => (
        fg: AppColors.warning,
        bg: AppColors.warning.withValues(alpha: 0.14),
      ),
      AppBadgeTone.danger => (
        fg: AppColors.error,
        bg: AppColors.error.withValues(alpha: 0.12),
      ),
      AppBadgeTone.info => (
        fg: AppColors.secondary,
        bg: AppColors.secondary.withValues(alpha: 0.12),
      ),
    };
  }

  @override
  Widget build(BuildContext context) {
    final c = _colors(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: c.bg, borderRadius: AppRadius.fullR),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: c.fg),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: c.fg,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}
