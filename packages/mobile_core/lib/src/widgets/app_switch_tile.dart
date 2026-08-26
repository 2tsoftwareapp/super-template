import 'package:flutter/material.dart';
import 'package:mobile_core/src/design/app_spacing.dart';
import 'package:mobile_core/src/widgets/app_card.dart';

/// A labeled switch row wrapped in an [AppCard]. Tapping the row toggles.
///
/// ```dart
/// AppSwitchTile(
///   title: 'Email notifications',
///   subtitle: 'Receive updates by email',
///   value: enabled,
///   onChanged: (v) => setState(() => enabled = v),
/// )
/// ```
class AppSwitchTile extends StatelessWidget {
  const AppSwitchTile({
    required this.title,
    required this.value,
    required this.onChanged,
    this.subtitle,
    this.icon,
    super.key,
  });

  final String title;
  final String? subtitle;
  final IconData? icon;
  final bool value;
  final ValueChanged<bool>? onChanged;

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;
    final enabled = onChanged != null;

    return AppCard(
      onTap: enabled ? () => onChanged!(!value) : null,
      child: Row(
        children: [
          if (icon != null) ...[
            Icon(
              icon,
              size: 20,
              color: enabled
                  ? cs.onSurfaceVariant
                  : cs.onSurface.withValues(alpha: 0.4),
            ),
            const SizedBox(width: AppSpacing.md),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style: tt.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Switch(value: value, onChanged: onChanged),
        ],
      ),
    );
  }
}
