import 'package:flutter/material.dart';
import 'package:mobile_app/core/design/app_radius.dart';
import 'package:mobile_app/core/design/app_spacing.dart';
import 'package:mobile_app/core/widgets/app_card.dart';

/// A single selectable option for [AppRadioGroup].
class AppRadioOption<T> {
  const AppRadioOption({
    required this.value,
    required this.label,
    this.subtitle,
    this.icon,
  });

  final T value;
  final String label;
  final String? subtitle;
  final IconData? icon;
}

/// A vertical group of radio options rendered as cards. The selected option is
/// highlighted with the primary colour.
///
/// ```dart
/// AppRadioGroup<String>(
///   value: theme,
///   options: const [
///     AppRadioOption(value: 'light', label: 'Light'),
///     AppRadioOption(value: 'dark', label: 'Dark'),
///   ],
///   onChanged: (v) => setState(() => theme = v),
/// )
/// ```
class AppRadioGroup<T> extends StatelessWidget {
  const AppRadioGroup({
    required this.value,
    required this.options,
    required this.onChanged,
    this.spacing = AppSpacing.sm,
    super.key,
  });

  final T? value;
  final List<AppRadioOption<T>> options;
  final ValueChanged<T>? onChanged;
  final double spacing;

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;

    return Column(
      children: [
        for (var i = 0; i < options.length; i++) ...[
          if (i > 0) SizedBox(height: spacing),
          Builder(
            builder: (_) {
              final option = options[i];
              final selected = option.value == value;
              return AppCard(
                onTap: onChanged == null
                    ? null
                    : () => onChanged!(option.value),
                color: selected ? cs.primaryContainer : null,
                borderRadius: AppRadius.mdR,
                child: Row(
                  children: [
                    if (option.icon != null) ...[
                      Icon(
                        option.icon,
                        size: 20,
                        color: selected ? cs.primary : cs.onSurfaceVariant,
                      ),
                      const SizedBox(width: AppSpacing.md),
                    ],
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            option.label,
                            style: tt.titleSmall?.copyWith(
                              fontWeight: FontWeight.w600,
                              color: selected ? cs.onPrimaryContainer : null,
                            ),
                          ),
                          if (option.subtitle != null) ...[
                            const SizedBox(height: 2),
                            Text(
                              option.subtitle!,
                              style: tt.bodySmall?.copyWith(
                                color: cs.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    Icon(
                      selected
                          ? Icons.radio_button_checked_rounded
                          : Icons.radio_button_unchecked_rounded,
                      size: 20,
                      color: selected ? cs.primary : cs.onSurfaceVariant,
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ],
    );
  }
}
