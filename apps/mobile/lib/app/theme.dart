import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/design/app_colors.dart';
import 'package:mobile_app/core/design/app_radius.dart';
import 'package:mobile_app/core/design/app_spacing.dart';
import 'package:mobile_app/core/storage/theme_store.dart';

final themeModeProvider = StateNotifierProvider<ThemeModeController, ThemeMode>(
  (ref) => ThemeModeController(ref.watch(themeStoreProvider)),
);

class ThemeModeController extends StateNotifier<ThemeMode> {
  ThemeModeController(this._store) : super(_store.read());

  final ThemeStore _store;

  Future<void> toggle() async {
    state = state == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    await _store.write(state);
  }

  Future<void> setTheme(String theme) async {
    final mode = switch (theme) {
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      _ => ThemeMode.system,
    };
    state = mode;
    await _store.write(mode);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Color Schemes
// ─────────────────────────────────────────────────────────────────────────────

const _lightScheme = ColorScheme(
  brightness: Brightness.light,
  primary: AppColors.primary,
  onPrimary: AppColors.onPrimary,
  primaryContainer: AppColors.primaryContainer,
  onPrimaryContainer: AppColors.onPrimaryContainer,
  secondary: AppColors.secondary,
  onSecondary: AppColors.onSecondary,
  secondaryContainer: AppColors.secondaryContainer,
  onSecondaryContainer: AppColors.onSecondaryContainer,
  tertiary: AppColors.accent,
  onTertiary: AppColors.onAccent,
  tertiaryContainer: AppColors.accentContainer,
  onTertiaryContainer: Color(0xFF064E3B),
  error: AppColors.error,
  onError: AppColors.onError,
  errorContainer: AppColors.errorContainer,
  onErrorContainer: AppColors.onErrorContainer,
  surface: AppColors.surfaceLight,
  onSurface: AppColors.onSurfaceLight,
  surfaceContainerHighest: AppColors.surfaceContainerLight,
  onSurfaceVariant: AppColors.onSurfaceMutedLight,
  outline: AppColors.outlineLight,
  outlineVariant: AppColors.outlineVariantLight,
  shadow: Color(0xFF000000),
  scrim: Color(0xFF000000),
  inverseSurface: AppColors.surfaceDark,
  onInverseSurface: AppColors.onSurfaceDark,
  inversePrimary: AppColors.primaryDark,
);

const _darkScheme = ColorScheme(
  brightness: Brightness.dark,
  primary: AppColors.primaryDark,
  onPrimary: AppColors.onPrimary,
  primaryContainer: Color(0xFF312E81), // indigo-900
  onPrimaryContainer: AppColors.primaryContainer,
  secondary: Color(0xFF22D3EE), // cyan-400
  onSecondary: Color(0xFF0C4A6E),
  secondaryContainer: Color(0xFF0E7490), // cyan-700
  onSecondaryContainer: Color(0xFFCFFAFE),
  tertiary: Color(0xFF34D399), // emerald-400
  onTertiary: Color(0xFF064E3B),
  tertiaryContainer: Color(0xFF065F46), // emerald-800
  onTertiaryContainer: Color(0xFFD1FAE5),
  error: Color(0xFFF87171), // red-400
  onError: Color(0xFF7F1D1D),
  errorContainer: Color(0xFF991B1B), // red-800
  onErrorContainer: Color(0xFFFEE2E2),
  surface: AppColors.surfaceDark,
  onSurface: AppColors.onSurfaceDark,
  surfaceContainerHighest: AppColors.surfaceContainerDark,
  onSurfaceVariant: AppColors.onSurfaceMutedDark,
  outline: AppColors.outlineDark,
  outlineVariant: AppColors.outlineVariantDark,
  shadow: Color(0xFF000000),
  scrim: Color(0xFF000000),
  inverseSurface: AppColors.surfaceLight,
  onInverseSurface: AppColors.onSurfaceLight,
  inversePrimary: AppColors.primary,
);

// ─────────────────────────────────────────────────────────────────────────────
// Theme builders
// ─────────────────────────────────────────────────────────────────────────────

ThemeData buildLightTheme() => _buildTheme(
  scheme: _lightScheme,
  scaffoldBg: AppColors.backgroundLight,
  brightness: Brightness.light,
  statusBarBrightness: Brightness.dark,
);

ThemeData buildDarkTheme() => _buildTheme(
  scheme: _darkScheme,
  scaffoldBg: AppColors.backgroundDark,
  brightness: Brightness.dark,
  statusBarBrightness: Brightness.light,
);

ThemeData _buildTheme({
  required ColorScheme scheme,
  required Color scaffoldBg,
  required Brightness brightness,
  required Brightness statusBarBrightness,
}) {
  final isLight = brightness == Brightness.light;

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: scaffoldBg,

    // ── AppBar ──────────────────────────────────────────────────────────
    appBarTheme: AppBarTheme(
      elevation: 0,
      scrolledUnderElevation: 1,
      centerTitle: false,
      backgroundColor: scaffoldBg,
      foregroundColor: scheme.onSurface,
      shadowColor: AppColors.shadowSm,
      surfaceTintColor: Colors.transparent,
      titleTextStyle: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: scheme.onSurface,
        letterSpacing: -0.3,
      ),
      systemOverlayStyle: SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: statusBarBrightness,
        statusBarBrightness: brightness,
      ),
    ),

    // ── Card ────────────────────────────────────────────────────────────
    cardTheme: CardThemeData(
      elevation: 0,
      margin: EdgeInsets.zero,
      color: isLight ? AppColors.surfaceLight : AppColors.surfaceContainerDark,
      shape: RoundedRectangleBorder(
        borderRadius: AppRadius.lgR,
        side: BorderSide(
          color: isLight
              ? AppColors.outlineVariantLight
              : AppColors.outlineVariantDark,
          width: 1,
        ),
      ),
    ),

    // ── Filled Button ───────────────────────────────────────────────────
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(0, 52),
        shape: RoundedRectangleBorder(borderRadius: AppRadius.mdR),
        textStyle: const TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          letterSpacing: 0,
        ),
        elevation: 0,
      ),
    ),

    // ── Outlined Button ─────────────────────────────────────────────────
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(0, 52),
        shape: RoundedRectangleBorder(borderRadius: AppRadius.mdR),
        side: BorderSide(
          color: isLight ? AppColors.outlineLight : AppColors.outlineDark,
        ),
        textStyle: const TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w500,
          letterSpacing: 0,
        ),
      ),
    ),

    // ── Text Button ─────────────────────────────────────────────────────
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        textStyle: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          letterSpacing: 0,
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: AppSpacing.xs,
        ),
      ),
    ),

    // ── Input Decoration ────────────────────────────────────────────────
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: isLight
          ? AppColors.surfaceContainerLight
          : AppColors.surfaceContainerDark,
      border: OutlineInputBorder(
        borderRadius: AppRadius.mdR,
        borderSide: BorderSide(
          color: isLight ? AppColors.outlineLight : AppColors.outlineDark,
        ),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: AppRadius.mdR,
        borderSide: BorderSide(
          color: isLight
              ? AppColors.outlineVariantLight
              : AppColors.outlineDark,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: AppRadius.mdR,
        borderSide: BorderSide(color: scheme.primary, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: AppRadius.mdR,
        borderSide: BorderSide(color: scheme.error),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: AppRadius.mdR,
        borderSide: BorderSide(color: scheme.error, width: 2),
      ),
      labelStyle: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: scheme.onSurfaceVariant,
      ),
      hintStyle: TextStyle(
        fontSize: 15,
        color: scheme.onSurfaceVariant.withValues(alpha: 0.7),
      ),
      errorStyle: TextStyle(
        fontSize: 12,
        color: scheme.error,
        fontWeight: FontWeight.w500,
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.base,
        vertical: AppSpacing.md,
      ),
      floatingLabelBehavior: FloatingLabelBehavior.auto,
      isDense: false,
    ),

    // ── ListTile ────────────────────────────────────────────────────────
    listTileTheme: ListTileThemeData(
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.base,
        vertical: AppSpacing.sm,
      ),
      minVerticalPadding: AppSpacing.sm,
      shape: RoundedRectangleBorder(borderRadius: AppRadius.mdR),
    ),

    // ── Divider ─────────────────────────────────────────────────────────
    dividerTheme: DividerThemeData(
      color: isLight
          ? AppColors.outlineVariantLight
          : AppColors.outlineVariantDark,
      thickness: 1,
      space: 1,
    ),

    // ── BottomNavigationBar ─────────────────────────────────────────────
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      elevation: 0,
      backgroundColor: isLight ? AppColors.surfaceLight : AppColors.surfaceDark,
      selectedItemColor: scheme.primary,
      unselectedItemColor: scheme.onSurfaceVariant,
      type: BottomNavigationBarType.fixed,
    ),

    // ── NavigationBar ───────────────────────────────────────────────────
    navigationBarTheme: NavigationBarThemeData(
      elevation: 0,
      height: 72,
      backgroundColor: isLight ? AppColors.surfaceLight : AppColors.surfaceDark,
      indicatorColor: scheme.primaryContainer,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return TextStyle(
          fontSize: 11,
          fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
          color: selected ? scheme.primary : scheme.onSurfaceVariant,
        );
      }),
    ),

    // ── SnackBar ────────────────────────────────────────────────────────
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: AppRadius.mdR),
      backgroundColor: isLight
          ? AppColors.onSurfaceLight
          : AppColors.onBackgroundDark,
      contentTextStyle: TextStyle(
        color: isLight ? AppColors.surfaceLight : AppColors.backgroundDark,
        fontSize: 14,
        fontWeight: FontWeight.w500,
      ),
    ),

    // ── Dialog ──────────────────────────────────────────────────────────
    dialogTheme: DialogThemeData(
      elevation: 0,
      backgroundColor: isLight ? AppColors.surfaceLight : AppColors.surfaceDark,
      shape: RoundedRectangleBorder(borderRadius: AppRadius.xlR),
      titleTextStyle: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: scheme.onSurface,
        letterSpacing: -0.3,
      ),
      contentTextStyle: TextStyle(
        fontSize: 14,
        color: scheme.onSurfaceVariant,
        height: 1.5,
      ),
    ),

    // ── Chip ────────────────────────────────────────────────────────────
    chipTheme: ChipThemeData(
      shape: RoundedRectangleBorder(borderRadius: AppRadius.fullR),
      side: BorderSide(
        color: isLight ? AppColors.outlineVariantLight : AppColors.outlineDark,
      ),
      labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xxs,
      ),
    ),

    // ── Progress indicator ───────────────────────────────────────────────
    progressIndicatorTheme: ProgressIndicatorThemeData(
      color: scheme.primary,
      circularTrackColor: scheme.primaryContainer,
      linearTrackColor: scheme.primaryContainer,
    ),

    // ── Typography ───────────────────────────────────────────────────────
    textTheme: _buildTextTheme(scheme.onSurface, scheme.onSurfaceVariant),
  );
}

TextTheme _buildTextTheme(Color onSurface, Color muted) {
  return TextTheme(
    displayLarge: TextStyle(
      fontSize: 57,
      fontWeight: FontWeight.w700,
      color: onSurface,
      letterSpacing: -1.5,
      height: 1.1,
    ),
    displayMedium: TextStyle(
      fontSize: 45,
      fontWeight: FontWeight.w700,
      color: onSurface,
      letterSpacing: -1,
      height: 1.15,
    ),
    displaySmall: TextStyle(
      fontSize: 36,
      fontWeight: FontWeight.w700,
      color: onSurface,
      letterSpacing: -0.5,
      height: 1.2,
    ),
    headlineLarge: TextStyle(
      fontSize: 32,
      fontWeight: FontWeight.w700,
      color: onSurface,
      letterSpacing: -0.5,
      height: 1.25,
    ),
    headlineMedium: TextStyle(
      fontSize: 28,
      fontWeight: FontWeight.w700,
      color: onSurface,
      letterSpacing: -0.3,
      height: 1.3,
    ),
    headlineSmall: TextStyle(
      fontSize: 24,
      fontWeight: FontWeight.w600,
      color: onSurface,
      letterSpacing: -0.2,
      height: 1.3,
    ),
    titleLarge: TextStyle(
      fontSize: 20,
      fontWeight: FontWeight.w700,
      color: onSurface,
      letterSpacing: -0.2,
      height: 1.4,
    ),
    titleMedium: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w600,
      color: onSurface,
      letterSpacing: -0.1,
      height: 1.5,
    ),
    titleSmall: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w600,
      color: onSurface,
      letterSpacing: 0,
      height: 1.5,
    ),
    bodyLarge: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w400,
      color: onSurface,
      letterSpacing: 0,
      height: 1.6,
    ),
    bodyMedium: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w400,
      color: onSurface,
      letterSpacing: 0,
      height: 1.6,
    ),
    bodySmall: TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.w400,
      color: muted,
      letterSpacing: 0,
      height: 1.5,
    ),
    labelLarge: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w600,
      color: onSurface,
      letterSpacing: 0,
    ),
    labelMedium: TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.w500,
      color: muted,
      letterSpacing: 0.1,
    ),
    labelSmall: TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w500,
      color: muted,
      letterSpacing: 0.2,
    ),
  );
}
