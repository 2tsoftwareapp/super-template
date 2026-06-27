import 'package:flutter/material.dart';
import 'package:mobile_app/core/design/app_colors.dart';

/// Shows a confirmation dialog and resolves to `true` when the user confirms.
///
/// ```dart
/// final ok = await showConfirmDialog(
///   context,
///   title: 'Delete project',
///   message: 'This action cannot be undone.',
///   confirmLabel: 'Delete',
///   destructive: true,
/// );
/// if (ok) { ... }
/// ```
Future<bool> showConfirmDialog(
  BuildContext context, {
  required String title,
  String? message,
  String confirmLabel = 'Confirm',
  String cancelLabel = 'Cancel',
  bool destructive = false,
}) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(title),
      content: message != null ? Text(message) : null,
      actions: [
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(false),
          child: Text(cancelLabel),
        ),
        FilledButton(
          onPressed: () => Navigator.of(ctx).pop(true),
          style: destructive
              ? FilledButton.styleFrom(
                  backgroundColor: AppColors.error,
                  foregroundColor: AppColors.onError,
                )
              : null,
          child: Text(confirmLabel),
        ),
      ],
    ),
  );
  return result ?? false;
}
