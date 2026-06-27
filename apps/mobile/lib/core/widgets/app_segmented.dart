import 'package:flutter/material.dart';
import 'package:mobile_app/core/design/app_colors.dart';
import 'package:mobile_app/core/design/app_radius.dart';

/// A single segment for [AppSegmented].
class AppSegment<T> {
  const AppSegment({required this.value, required this.label, this.icon});

  final T value;
  final String label;
  final IconData? icon;
}

/// iOS-style segmented control for switching between a small set of options.
///
/// ```dart
/// AppSegmented<String>(
///   value: tab,
///   segments: const [
///     AppSegment(value: 'all', label: 'All'),
///     AppSegment(value: 'unread', label: 'Unread'),
///   ],
///   onChanged: (v) => setState(() => tab = v),
/// )
/// ```
class AppSegmented<T> extends StatelessWidget {
  const AppSegmented({
    required this.value,
    required this.segments,
    required this.onChanged,
    super.key,
  });

  final T value;
  final List<AppSegment<T>> segments;
  final ValueChanged<T> onChanged;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cs = Theme.of(context).colorScheme;
    final trackColor = isDark
        ? AppColors.surfaceContainerHighDark
        : AppColors.surfaceContainerLight;

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(color: trackColor, borderRadius: AppRadius.mdR),
      child: Row(
        children: [
          for (final segment in segments)
            Expanded(
              child: _SegmentButton(
                label: segment.label,
                icon: segment.icon,
                selected: segment.value == value,
                onTap: () => onChanged(segment.value),
                surface: isDark
                    ? AppColors.surfaceDark
                    : AppColors.surfaceLight,
                selectedFg: cs.onSurface,
                unselectedFg: cs.onSurfaceVariant,
              ),
            ),
        ],
      ),
    );
  }
}

class _SegmentButton extends StatelessWidget {
  const _SegmentButton({
    required this.label,
    required this.selected,
    required this.onTap,
    required this.surface,
    required this.selectedFg,
    required this.unselectedFg,
    this.icon,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final Color surface;
  final Color selectedFg;
  final Color unselectedFg;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: selected ? surface : Colors.transparent,
          borderRadius: AppRadius.smR,
          boxShadow: selected
              ? const [
                  BoxShadow(
                    color: AppColors.shadowSm,
                    blurRadius: 4,
                    offset: Offset(0, 1),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 16, color: selected ? selectedFg : unselectedFg),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: selected ? selectedFg : unselectedFg,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
