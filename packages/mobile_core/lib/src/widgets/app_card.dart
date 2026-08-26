import 'package:flutter/material.dart';
import 'package:mobile_core/src/design/app_colors.dart';
import 'package:mobile_core/src/design/app_radius.dart';
import 'package:mobile_core/src/design/app_spacing.dart';

/// Surface container with consistent border + radius. Tappable when [onTap]
/// is provided (renders ripple via [InkWell]).
class AppCard extends StatelessWidget {
  const AppCard({
    required this.child,
    this.onTap,
    this.padding = const EdgeInsets.all(AppSpacing.base),
    this.borderRadius,
    this.color,
    this.border = true,
    super.key,
  });

  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry padding;
  final BorderRadius? borderRadius;
  final Color? color;
  final bool border;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final radius = borderRadius ?? AppRadius.lgR;
    final bg =
        color ??
        (isDark ? AppColors.surfaceContainerDark : AppColors.surfaceLight);
    final borderColor = isDark
        ? AppColors.outlineVariantDark
        : AppColors.outlineVariantLight;

    final content = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: onTap == null ? bg : null,
        borderRadius: radius,
        border: border ? Border.all(color: borderColor) : null,
      ),
      child: child,
    );

    if (onTap == null) return content;

    return Material(
      color: bg,
      borderRadius: radius,
      child: InkWell(onTap: onTap, borderRadius: radius, child: content),
    );
  }
}
