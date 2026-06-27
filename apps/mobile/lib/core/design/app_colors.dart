import 'package:flutter/material.dart';

abstract final class AppColors {
  // ── Brand ──────────────────────────────────────────────────────────────
  static const primary = Color(0xFF4F46E5); // indigo-600
  static const primaryDark = Color(0xFF6366F1); // indigo-500 (for dark mode)
  static const primaryContainer = Color(0xFFEEF2FF); // indigo-50
  static const onPrimary = Color(0xFFFFFFFF);
  static const onPrimaryContainer = Color(0xFF312E81); // indigo-900

  // ── Secondary ──────────────────────────────────────────────────────────
  static const secondary = Color(0xFF0891B2); // cyan-600
  static const secondaryContainer = Color(0xFFCFFAFE); // cyan-50
  static const onSecondary = Color(0xFFFFFFFF);
  static const onSecondaryContainer = Color(0xFF0C4A6E);

  // ── Accent / success ───────────────────────────────────────────────────
  static const accent = Color(0xFF059669); // emerald-600
  static const accentContainer = Color(0xFFD1FAE5); // emerald-50
  static const onAccent = Color(0xFFFFFFFF);

  // ── Semantic ───────────────────────────────────────────────────────────
  static const error = Color(0xFFDC2626); // red-600
  static const errorContainer = Color(0xFFFEE2E2); // red-50
  static const onError = Color(0xFFFFFFFF);
  static const onErrorContainer = Color(0xFF7F1D1D);

  static const warning = Color(0xFFD97706); // amber-600
  static const warningContainer = Color(0xFFFEF3C7); // amber-50
  static const onWarning = Color(0xFFFFFFFF);

  // ── Light surface tokens ───────────────────────────────────────────────
  static const backgroundLight = Color(0xFFF8FAFC); // slate-50
  static const surfaceLight = Color(0xFFFFFFFF);
  static const surfaceContainerLight = Color(0xFFF1F5F9); // slate-100
  static const surfaceContainerHighLight = Color(0xFFE2E8F0); // slate-200
  static const outlineLight = Color(0xFFCBD5E1); // slate-300
  static const outlineVariantLight = Color(0xFFE2E8F0); // slate-200

  // ── Light text tokens ──────────────────────────────────────────────────
  static const onBackgroundLight = Color(0xFF0F172A); // slate-900
  static const onSurfaceLight = Color(0xFF1E293B); // slate-800
  static const onSurfaceMutedLight = Color(0xFF64748B); // slate-500
  static const onSurfaceDisabledLight = Color(0xFFCBD5E1); // slate-300

  // ── Dark surface tokens ────────────────────────────────────────────────
  static const backgroundDark = Color(0xFF0F172A); // slate-900
  static const surfaceDark = Color(0xFF1E293B); // slate-800
  static const surfaceContainerDark = Color(0xFF293548);
  static const surfaceContainerHighDark = Color(0xFF334155); // slate-700
  static const outlineDark = Color(0xFF334155); // slate-700
  static const outlineVariantDark = Color(0xFF293548);

  // ── Dark text tokens ───────────────────────────────────────────────────
  static const onBackgroundDark = Color(0xFFF8FAFC); // slate-50
  static const onSurfaceDark = Color(0xFFE2E8F0); // slate-200
  static const onSurfaceMutedDark = Color(0xFF94A3B8); // slate-400
  static const onSurfaceDisabledDark = Color(0xFF475569); // slate-600

  // ── Shadows ────────────────────────────────────────────────────────────
  static const shadowSm = Color(0x0A000000);
  static const shadowMd = Color(0x14000000);
  static const shadowLg = Color(0x1F000000);

  // ── Feature card accent colours ────────────────────────────────────────
  static const cardProjects = Color(0xFF4F46E5); // indigo
  static const cardNotifications = Color(0xFF0891B2); // cyan
  static const cardProfile = Color(0xFF059669); // emerald
  static const cardOrganizations = Color(0xFFF59E0B); // amber
  static const cardSecurity = Color(0xFFDC2626); // red
  static const cardSessions = Color(0xFF7C3AED); // violet
  static const cardPreferences = Color(0xFF0EA5E9); // sky
  static const cardImports = Color(0xFF16A34A); // green
  static const cardExports = Color(0xFF9333EA); // purple
  static const cardAdmin = Color(0xFFEA580C); // orange
}
