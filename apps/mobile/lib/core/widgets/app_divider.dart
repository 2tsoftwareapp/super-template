import 'package:flutter/material.dart';
import 'package:mobile_app/core/design/app_colors.dart';
import 'package:mobile_app/core/design/app_spacing.dart';

/// A thin separator line. When [label] is provided, the label is centered with
/// a line on each side (e.g. "OR").
class AppDivider extends StatelessWidget {
  const AppDivider({this.label, this.spacing = AppSpacing.base, super.key});

  final String? label;
  final double spacing;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final lineColor = isDark
        ? AppColors.outlineVariantDark
        : AppColors.outlineVariantLight;
    final cs = Theme.of(context).colorScheme;

    if (label == null) {
      return Padding(
        padding: EdgeInsets.symmetric(vertical: spacing),
        child: Divider(height: 1, thickness: 1, color: lineColor),
      );
    }

    return Padding(
      padding: EdgeInsets.symmetric(vertical: spacing),
      child: Row(
        children: [
          Expanded(child: Divider(thickness: 1, color: lineColor)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
            child: Text(
              label!,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: cs.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(child: Divider(thickness: 1, color: lineColor)),
        ],
      ),
    );
  }
}
