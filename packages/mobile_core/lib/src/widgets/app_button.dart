import 'package:flutter/material.dart';
import 'package:mobile_core/src/design/app_colors.dart';

enum AppButtonVariant { primary, secondary, outline, danger, text }

enum AppButtonSize { small, medium, large }

/// Unified button with loading state, optional icon, and full-width support.
///
/// ```dart
/// AppButton(
///   label: 'Save',
///   loading: _saving,
///   onPressed: _save,
/// )
/// ```
class AppButton extends StatelessWidget {
  const AppButton({
    required this.label,
    required this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.large,
    this.icon,
    this.loading = false,
    this.fullWidth = true,
    super.key,
  });

  final String label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final AppButtonSize size;
  final IconData? icon;
  final bool loading;
  final bool fullWidth;

  double get _height => switch (size) {
    AppButtonSize.small => 40,
    AppButtonSize.medium => 48,
    AppButtonSize.large => 52,
  };

  @override
  Widget build(BuildContext context) {
    final disabled = loading || onPressed == null;
    final child = _buildChild(context);
    final sizeStyle = ButtonStyle(
      minimumSize: WidgetStateProperty.all(Size(0, _height)),
      padding: WidgetStateProperty.all(
        const EdgeInsets.symmetric(horizontal: 16),
      ),
    );

    final button = switch (variant) {
      AppButtonVariant.primary => FilledButton(
        onPressed: disabled ? null : onPressed,
        style: sizeStyle,
        child: child,
      ),
      AppButtonVariant.secondary => FilledButton.tonal(
        onPressed: disabled ? null : onPressed,
        style: sizeStyle,
        child: child,
      ),
      AppButtonVariant.outline => OutlinedButton(
        onPressed: disabled ? null : onPressed,
        style: sizeStyle,
        child: child,
      ),
      AppButtonVariant.danger => FilledButton(
        onPressed: disabled ? null : onPressed,
        style: sizeStyle.merge(
          FilledButton.styleFrom(
            backgroundColor: AppColors.error,
            foregroundColor: AppColors.onError,
          ),
        ),
        child: child,
      ),
      AppButtonVariant.text => TextButton(
        onPressed: disabled ? null : onPressed,
        style: sizeStyle,
        child: child,
      ),
    };

    if (!fullWidth) {
      return SizedBox(height: _height, child: button);
    }

    return SizedBox(width: double.infinity, height: _height, child: button);
  }

  Widget _buildChild(BuildContext context) {
    if (loading) {
      final color = switch (variant) {
        AppButtonVariant.outline ||
        AppButtonVariant.text => Theme.of(context).colorScheme.primary,
        _ => Colors.white,
      };
      return SizedBox(
        width: 20,
        height: 20,
        child: CircularProgressIndicator(strokeWidth: 2.4, color: color),
      );
    }

    if (icon != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [Icon(icon, size: 18), const SizedBox(width: 8), Text(label)],
      );
    }

    return Text(label);
  }
}
