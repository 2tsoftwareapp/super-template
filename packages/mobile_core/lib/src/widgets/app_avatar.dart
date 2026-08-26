import 'package:flutter/material.dart';
import 'package:mobile_core/src/design/app_radius.dart';

/// Circular avatar showing user initials with a brand-coloured background.
class AppAvatar extends StatelessWidget {
  const AppAvatar({
    required this.name,
    this.size = 40,
    this.backgroundColor,
    this.foregroundColor,
    super.key,
  });

  final String name;
  final double size;
  final Color? backgroundColor;
  final Color? foregroundColor;

  String get _initials {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return '?';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final bg = backgroundColor ?? cs.primaryContainer;
    final fg = foregroundColor ?? cs.primary;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppRadius.full),
      ),
      alignment: Alignment.center,
      child: Text(
        _initials,
        style: TextStyle(
          fontSize: size * 0.36,
          fontWeight: FontWeight.w700,
          color: fg,
          height: 1,
        ),
      ),
    );
  }
}
