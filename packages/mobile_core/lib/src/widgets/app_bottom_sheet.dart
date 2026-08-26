import 'package:flutter/material.dart';
import 'package:mobile_core/src/design/app_radius.dart';
import 'package:mobile_core/src/design/app_spacing.dart';

/// Shows a styled modal bottom sheet with a drag handle, optional title, and
/// safe-area aware padding. Returns the value the sheet was popped with.
///
/// ```dart
/// await showAppBottomSheet<void>(
///   context,
///   title: 'Filters',
///   builder: (ctx) => const FilterForm(),
/// );
/// ```
Future<T?> showAppBottomSheet<T>(
  BuildContext context, {
  required WidgetBuilder builder,
  String? title,
  bool isScrollControlled = true,
  bool showHandle = true,
}) {
  final cs = Theme.of(context).colorScheme;

  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: isScrollControlled,
    backgroundColor: Theme.of(context).scaffoldBackgroundColor,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
    ),
    builder: (ctx) {
      final bottomInset = MediaQuery.of(ctx).viewInsets.bottom;
      return Padding(
        padding: EdgeInsets.only(bottom: bottomInset),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (showHandle)
                Center(
                  child: Container(
                    margin: const EdgeInsets.only(top: AppSpacing.md),
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: cs.onSurfaceVariant.withValues(alpha: 0.4),
                      borderRadius: AppRadius.fullR,
                    ),
                  ),
                ),
              if (title != null)
                Padding(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.xl,
                    AppSpacing.base,
                    AppSpacing.xl,
                    AppSpacing.sm,
                  ),
                  child: Text(
                    title,
                    style: Theme.of(ctx).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              Flexible(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.xl,
                    AppSpacing.sm,
                    AppSpacing.xl,
                    AppSpacing.xl,
                  ),
                  child: builder(ctx),
                ),
              ),
            ],
          ),
        ),
      );
    },
  );
}
