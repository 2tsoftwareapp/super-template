import 'package:flutter/material.dart';
import 'package:mobile_app/core/design/app_colors.dart';
import 'package:mobile_app/core/design/app_radius.dart';

/// A rounded linear progress bar. Pass [value] (0..1) for determinate progress,
/// or leave null for an indeterminate bar.
class AppProgress extends StatelessWidget {
  const AppProgress({this.value, this.height = 8, super.key});

  final double? value;
  final double height;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final track = isDark
        ? AppColors.surfaceContainerHighDark
        : AppColors.surfaceContainerHighLight;

    return ClipRRect(
      borderRadius: AppRadius.fullR,
      child: LinearProgressIndicator(
        value: value,
        minHeight: height,
        backgroundColor: track,
        valueColor: const AlwaysStoppedAnimation(AppColors.primary),
      ),
    );
  }
}

/// A centered circular spinner with an optional label.
class AppSpinner extends StatelessWidget {
  const AppSpinner({this.label, this.size = 28, super.key});

  final String? label;
  final double size;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: size,
            height: size,
            child: const CircularProgressIndicator(strokeWidth: 2.6),
          ),
          if (label != null) ...[
            const SizedBox(height: 12),
            Text(
              label!,
              style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13),
            ),
          ],
        ],
      ),
    );
  }
}

/// Wraps [child] and shows a dimmed blocking spinner overlay when [loading].
class AppLoadingOverlay extends StatelessWidget {
  const AppLoadingOverlay({
    required this.loading,
    required this.child,
    this.message,
    super.key,
  });

  final bool loading;
  final Widget child;
  final String? message;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        child,
        if (loading)
          Positioned.fill(
            child: ColoredBox(
              color: Colors.black.withValues(alpha: 0.35),
              child: AppSpinner(label: message),
            ),
          ),
      ],
    );
  }
}
