import 'package:flutter/material.dart';
import 'package:mobile_core/src/design/app_radius.dart';

/// A compact, tappable choice chip. Highlights when [selected].
///
/// ```dart
/// AppChip(
///   label: 'All',
///   selected: filter == 'all',
///   onTap: () => setState(() => filter = 'all'),
/// )
/// ```
class AppChip extends StatelessWidget {
  const AppChip({
    required this.label,
    this.selected = false,
    this.onTap,
    this.icon,
    super.key,
  });

  final String label;
  final bool selected;
  final VoidCallback? onTap;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final fg = selected ? cs.onPrimary : cs.onSurfaceVariant;
    final bg = selected ? cs.primary : cs.surfaceContainerHighest;

    return Material(
      color: bg,
      borderRadius: AppRadius.fullR,
      child: InkWell(
        onTap: onTap,
        borderRadius: AppRadius.fullR,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 16, color: fg),
                const SizedBox(width: 6),
              ],
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: fg,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// A horizontal, wrapping group of single-select [AppChip]s.
class AppChipGroup<T> extends StatelessWidget {
  const AppChipGroup({
    required this.value,
    required this.options,
    required this.onChanged,
    this.spacing = 8,
    super.key,
  });

  final T? value;
  final List<({T value, String label})> options;
  final ValueChanged<T>? onChanged;
  final double spacing;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: spacing,
      runSpacing: spacing,
      children: [
        for (final option in options)
          AppChip(
            label: option.label,
            selected: option.value == value,
            onTap: onChanged == null ? null : () => onChanged!(option.value),
          ),
      ],
    );
  }
}
