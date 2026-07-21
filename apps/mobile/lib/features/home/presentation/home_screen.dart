import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/app/theme.dart';
import 'package:mobile_app/core/design/app_colors.dart';
import 'package:mobile_app/core/design/app_radius.dart';
import 'package:mobile_app/core/design/app_spacing.dart';
import 'package:mobile_app/core/widgets/widgets.dart';
import 'package:mobile_app/features/auth/presentation/auth_controller.dart';
import 'package:mobile_app/features/exports/domain/export_permissions.dart';
import 'package:mobile_app/features/imports/domain/import_permissions.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider).valueOrNull;
    final tt = Theme.of(context).textTheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final name = auth?.displayName ?? 'User';
    final email = auth?.email ?? '';
    final importPermissions = selectImportPermissions(
      auth?.permissions ?? const [],
    );
    final exportPermissions = selectExportPermissions(
      auth?.permissions ?? const [],
    );

    return Scaffold(
      backgroundColor: isDark
          ? AppColors.backgroundDark
          : AppColors.backgroundLight,
      appBar: AppBar(
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: isDark
            ? AppColors.backgroundDark
            : AppColors.backgroundLight,
        title: Text(
          'Super Template',
          style: tt.titleLarge?.copyWith(fontWeight: FontWeight.w800),
        ),
        actions: [
          IconButton(
            onPressed: () => ref.read(themeModeProvider.notifier).toggle(),
            icon: Icon(
              isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
            ),
            tooltip: 'Toggle theme',
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.base),
        children: [
          // ── Profile card ────────────────────────────────────────────────
          _ProfileCard(
            name: name,
            email: email,
            onLogout: () async {
              await ref.read(authControllerProvider.notifier).logout();
              if (context.mounted) context.go('/login');
            },
          ),

          // ── Account cluster ──────────────────────────────────────────────
          const SizedBox(height: AppSpacing.xl),
          AppListTile(
            icon: Icons.business_rounded,
            iconColor: AppColors.cardOrganizations,
            title: 'Organizations',
            subtitle: 'Switch or manage teams',
            onTap: () => context.push('/organizations'),
          ),
          const SizedBox(height: AppSpacing.sm),
          AppListTile(
            icon: Icons.tune_rounded,
            iconColor: AppColors.cardPreferences,
            title: 'Preferences',
            subtitle: 'Theme, language, timezone',
            onTap: () => context.push('/preferences'),
          ),
          const SizedBox(height: AppSpacing.sm),
          AppListTile(
            icon: Icons.lock_rounded,
            iconColor: AppColors.cardSecurity,
            title: 'Security',
            subtitle: 'Password & 2FA',
            onTap: () => context.push('/security'),
          ),
          const SizedBox(height: AppSpacing.sm),
          AppListTile(
            icon: Icons.devices_rounded,
            iconColor: AppColors.cardSessions,
            title: 'Sessions',
            subtitle: 'Active devices',
            onTap: () => context.push('/sessions'),
          ),

          // ── Tools (permission-gated) ─────────────────────────────────────
          if (importPermissions.canRead || exportPermissions.canRead) ...[
            const SizedBox(height: AppSpacing.xl),
            _GroupLabel('TOOLS'),
            if (importPermissions.canRead) ...[
              AppListTile(
                icon: Icons.upload_rounded,
                iconColor: AppColors.cardImports,
                title: 'Imports',
                subtitle: 'Upload data',
                onTap: () => context.push('/imports'),
              ),
              const SizedBox(height: AppSpacing.sm),
            ],
            if (exportPermissions.canRead)
              AppListTile(
                icon: Icons.download_rounded,
                iconColor: AppColors.cardExports,
                title: 'Exports',
                subtitle: 'Download data',
                onTap: () => context.push('/exports'),
              ),
          ],

          const SizedBox(height: AppSpacing.massive),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Group label
// ─────────────────────────────────────────────────────────────────────────────

class _GroupLabel extends StatelessWidget {
  const _GroupLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: AppSpacing.sm),
      child: Text(
        text,
        style: tt.labelSmall?.copyWith(
          color: cs.onSurfaceVariant,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.2,
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile card (gradient hero)
// ─────────────────────────────────────────────────────────────────────────────

class _ProfileCard extends StatelessWidget {
  const _ProfileCard({
    required this.name,
    required this.email,
    required this.onLogout,
  });

  final String name;
  final String email;
  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.base),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark
              ? [
                  cs.primary.withValues(alpha: 0.2),
                  cs.primary.withValues(alpha: 0.05),
                ]
              : [
                  cs.primaryContainer,
                  cs.primaryContainer.withValues(alpha: 0.4),
                ],
        ),
        borderRadius: AppRadius.xlR,
        border: Border.all(
          color: cs.primary.withValues(alpha: isDark ? 0.2 : 0.15),
        ),
      ),
      child: Row(
        children: [
          AppAvatar(name: name, size: 52),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: tt.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  email,
                  style: tt.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: onLogout,
            icon: const Icon(Icons.logout_rounded),
            tooltip: 'Sign out',
            style: IconButton.styleFrom(foregroundColor: cs.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}
