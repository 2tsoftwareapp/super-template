import 'package:flutter/material.dart';
import 'package:mobile_core/src/design/app_radius.dart';
import 'package:mobile_core/src/design/app_spacing.dart';
import 'package:mobile_core/src/widgets/app_card.dart';

/// List row with a coloured icon box, title, subtitle and trailing widget.
/// Defaults to a chevron when tappable and no [trailing] is supplied.
class AppListTile extends StatelessWidget {
  const AppListTile({
    required this.title,
    this.subtitle,
    this.icon,
    this.iconColor,
    this.leading,
    this.trailing,
    this.onTap,
    super.key,
  });

  final String title;
  final String? subtitle;
  final IconData? icon;
  final Color? iconColor;
  final Widget? leading;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final accent = iconColor ?? cs.primary;

    Widget? lead = leading;
    if (lead == null && icon != null) {
      lead = Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: accent.withValues(alpha: 0.1),
          borderRadius: AppRadius.mdR,
        ),
        child: Icon(icon, size: 20, color: accent),
      );
    }

    Widget? trail = trailing;
    if (trail == null && onTap != null) {
      trail = Icon(
        Icons.chevron_right_rounded,
        size: 20,
        color: cs.onSurfaceVariant,
      );
    }

    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.base,
        vertical: AppSpacing.md,
      ),
      child: Row(
        children: [
          if (lead != null) ...[lead, const SizedBox(width: AppSpacing.md)],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: tt.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (subtitle != null)
                  Text(
                    subtitle!,
                    style: tt.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
              ],
            ),
          ),
          if (trail != null) ...[const SizedBox(width: AppSpacing.sm), trail],
        ],
      ),
    );
  }
}
