import 'package:flutter/material.dart';
import 'package:mobile_core/src/design/app_colors.dart';
import 'package:mobile_core/src/design/app_radius.dart';
import 'package:mobile_core/src/errors/user_facing_error.dart';

enum _SnackTone { success, error, info }

/// Consistent snackbars. Prefer these over calling [ScaffoldMessenger] directly.
void showSuccessSnackBar(BuildContext context, String message) =>
    _show(context, message, _SnackTone.success);

void showErrorSnackBar(BuildContext context, Object error) =>
    _show(context, userFacingErrorMessage(error), _SnackTone.error);

void showInfoSnackBar(BuildContext context, String message) =>
    _show(context, message, _SnackTone.info);

void _show(BuildContext context, String message, _SnackTone tone) {
  final (color, icon) = switch (tone) {
    _SnackTone.success => (
      AppColors.accent,
      Icons.check_circle_outline_rounded,
    ),
    _SnackTone.error => (AppColors.error, Icons.error_outline_rounded),
    _SnackTone.info => (AppColors.secondary, Icons.info_outline_rounded),
  };

  ScaffoldMessenger.of(context)
    ..clearSnackBars()
    ..showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        backgroundColor: color,
        shape: RoundedRectangleBorder(borderRadius: AppRadius.mdR),
        content: Row(
          children: [
            Icon(icon, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(message, style: const TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
}
