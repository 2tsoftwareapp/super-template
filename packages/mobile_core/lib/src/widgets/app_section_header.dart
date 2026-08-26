import 'package:flutter/material.dart';
import 'package:mobile_core/src/design/app_spacing.dart';

/// Consistent section header with optional trailing action.
class AppSectionHeader extends StatelessWidget {
  const AppSectionHeader({
    required this.title,
    this.action,
    this.padding,
    super.key,
  });

  final String title;
  final Widget? action;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;

    return Padding(
      padding:
          padding ?? const EdgeInsets.symmetric(horizontal: AppSpacing.base),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: tt.titleSmall?.copyWith(
                color: cs.onSurfaceVariant,
                letterSpacing: 0.5,
              ),
            ),
          ),
          if (action case final Widget w) w,
        ],
      ),
    );
  }
}
