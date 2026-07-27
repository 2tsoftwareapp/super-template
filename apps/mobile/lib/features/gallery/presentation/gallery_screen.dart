import 'package:flutter/material.dart';
import 'package:mobile_app/core/design/app_colors.dart';
import 'package:mobile_app/core/design/app_radius.dart';
import 'package:mobile_app/core/design/app_spacing.dart';
import 'package:mobile_app/core/widgets/widgets.dart';

/// A living showcase of every shared UI component. Useful as design-system
/// documentation and for visual QA in light/dark mode.
class GalleryScreen extends StatefulWidget {
  const GalleryScreen({super.key});

  @override
  State<GalleryScreen> createState() => _GalleryScreenState();
}

class _GalleryScreenState extends State<GalleryScreen> {
  bool _switchValue = true;
  bool _checkboxValue = false;
  String _radioValue = 'system';
  String _chipValue = 'all';
  String _segmentValue = 'overview';
  bool _loadingButton = false;
  bool _showSkeletonPreview = true;
  final _textController = TextEditingController();
  final _searchController = TextEditingController(text: 'Design system');

  @override
  void dispose() {
    _textController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _simulateLoad() async {
    setState(() => _loadingButton = true);
    await Future<void>.delayed(const Duration(milliseconds: 1500));
    if (mounted) setState(() => _loadingButton = false);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: isDark
          ? AppColors.backgroundDark
          : AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('UI Kit'),
        centerTitle: false,
        actions: [
          IconButton(
            tooltip: 'Refresh preview',
            onPressed: () => setState(() => _showSkeletonPreview = true),
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.base),
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.base),
            child: _HeroCard(isDark: isDark, textTheme: tt),
          ),

          _section('Typography', [
            _TypographyRow(label: 'Headline Large', style: tt.headlineLarge),
            _TypographyRow(label: 'Headline Medium', style: tt.headlineMedium),
            _TypographyRow(label: 'Title Large', style: tt.titleLarge),
            _TypographyRow(label: 'Body Large', style: tt.bodyLarge),
            _TypographyRow(label: 'Body Medium', style: tt.bodyMedium),
            _TypographyRow(
              label: 'Body Small / Muted',
              style: tt.bodySmall?.copyWith(color: cs.onSurfaceVariant),
            ),
            _TypographyRow(label: 'Label Large', style: tt.labelLarge),
          ]),

          _section('Color palette', [
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: const [
                _ColorSwatch(label: 'Primary', color: AppColors.primary),
                _ColorSwatch(label: 'Secondary', color: AppColors.secondary),
                _ColorSwatch(label: 'Accent', color: AppColors.accent),
                _ColorSwatch(label: 'Warning', color: AppColors.warning),
                _ColorSwatch(label: 'Error', color: AppColors.error),
                _ColorSwatch(
                  label: 'Surface',
                  color: AppColors.surfaceContainerLight,
                  foreground: AppColors.onSurfaceLight,
                ),
              ],
            ),
          ]),

          _section('Avatars', [
            const Row(
              children: [
                AppAvatar(name: 'Alex Chen', size: 32),
                SizedBox(width: AppSpacing.sm),
                AppAvatar(name: 'Jordan Lee', size: 40),
                SizedBox(width: AppSpacing.sm),
                AppAvatar(name: 'Sam Rivera', size: 48),
                SizedBox(width: AppSpacing.sm),
                AppAvatar(
                  name: 'Taylor',
                  size: 56,
                  backgroundColor: AppColors.secondaryContainer,
                  foregroundColor: AppColors.secondary,
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            AppListTile(
              title: 'Alex Chen',
              subtitle: 'Product designer · Online',
              leading: const AppAvatar(name: 'Alex Chen'),
              trailing: const AppBadge(
                label: 'Admin',
                tone: AppBadgeTone.primary,
              ),
              onTap: () {},
            ),
          ]),

          _section('Feature cards', [
            SizedBox(
              height: 118,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _featureCards.length,
                separatorBuilder: (_, _) =>
                    const SizedBox(width: AppSpacing.sm),
                itemBuilder: (context, index) {
                  final card = _featureCards[index];
                  return _FeatureCard(
                    title: card.title,
                    subtitle: card.subtitle,
                    icon: card.icon,
                    color: card.color,
                  );
                },
              ),
            ),
          ]),

          _section('Buttons', [
            const AppButton(label: 'Primary', onPressed: _noop),
            const SizedBox(height: AppSpacing.sm),
            const AppButton(
              label: 'Secondary',
              variant: AppButtonVariant.secondary,
              onPressed: _noop,
            ),
            const SizedBox(height: AppSpacing.sm),
            const AppButton(
              label: 'Outline',
              variant: AppButtonVariant.outline,
              onPressed: _noop,
            ),
            const SizedBox(height: AppSpacing.sm),
            const AppButton(
              label: 'Danger',
              variant: AppButtonVariant.danger,
              icon: Icons.delete_outline_rounded,
              onPressed: _noop,
            ),
            const SizedBox(height: AppSpacing.sm),
            AppButton(
              label: 'Tap to load',
              loading: _loadingButton,
              onPressed: _simulateLoad,
            ),
            const SizedBox(height: AppSpacing.sm),
            const Row(
              children: [
                AppButton(
                  label: 'Small',
                  size: AppButtonSize.small,
                  fullWidth: false,
                  onPressed: _noop,
                ),
                SizedBox(width: AppSpacing.sm),
                AppButton(
                  label: 'Text',
                  variant: AppButtonVariant.text,
                  fullWidth: false,
                  onPressed: _noop,
                ),
                SizedBox(width: AppSpacing.sm),
                AppButton(label: 'Disabled', fullWidth: false, onPressed: null),
              ],
            ),
          ]),

          _section('Text fields', [
            AppTextField(
              controller: _searchController,
              label: 'Search',
              hint: 'Search…',
              prefixIcon: Icons.search_rounded,
              suffix: IconButton(
                onPressed: () => _searchController.clear(),
                icon: const Icon(Icons.close_rounded, size: 20),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            AppTextField(
              controller: _textController,
              label: 'Email',
              hint: 'you@example.com',
              prefixIcon: Icons.email_outlined,
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: AppSpacing.md),
            const AppTextField(
              label: 'Password',
              hint: 'Enter password',
              prefixIcon: Icons.lock_outline_rounded,
              obscure: true,
            ),
            const SizedBox(height: AppSpacing.md),
            const AppTextField(
              label: 'Notes',
              hint: 'Add a short description…',
              maxLines: 3,
            ),
            const SizedBox(height: AppSpacing.md),
            const AppTextField(
              label: 'Disabled field',
              hint: 'Read only value',
              enabled: false,
            ),
          ]),

          _section('Alerts', const [
            AppAlert(
              tone: AppAlertTone.info,
              title: 'Heads up',
              message: 'This is an informational message.',
            ),
            SizedBox(height: AppSpacing.sm),
            AppAlert(
              tone: AppAlertTone.success,
              message: 'Your changes were saved successfully.',
            ),
            SizedBox(height: AppSpacing.sm),
            AppAlert(
              tone: AppAlertTone.warning,
              title: 'Trial ending',
              message: 'Your trial ends in 3 days.',
            ),
            SizedBox(height: AppSpacing.sm),
            AppAlert(
              tone: AppAlertTone.danger,
              title: 'Something went wrong',
              message: 'We could not process your request.',
            ),
          ]),

          _section('Badges', [
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                AppBadge.status('ACTIVE'),
                AppBadge.status('PENDING'),
                AppBadge.status('FAILED'),
                AppBadge.status('DRAFT'),
                const AppBadge(label: 'Primary', tone: AppBadgeTone.primary),
                const AppBadge(label: 'Success', tone: AppBadgeTone.success),
                const AppBadge(label: 'Warning', tone: AppBadgeTone.warning),
                const AppBadge(label: 'Danger', tone: AppBadgeTone.danger),
                const AppBadge(label: 'Neutral', tone: AppBadgeTone.neutral),
                const AppBadge(
                  label: 'With icon',
                  tone: AppBadgeTone.info,
                  icon: Icons.star_rounded,
                ),
              ],
            ),
          ]),

          _section('List tiles', [
            AppListTile(
              title: 'Project Atlas',
              subtitle: 'Updated 2 hours ago',
              icon: Icons.folder_rounded,
              iconColor: AppColors.cardProjects,
              trailing: AppBadge.status('ACTIVE'),
              onTap: () {},
            ),
            const SizedBox(height: AppSpacing.sm),
            AppListTile(
              title: 'Security settings',
              subtitle: 'Two-factor authentication enabled',
              icon: Icons.shield_outlined,
              iconColor: AppColors.cardSecurity,
              onTap: () {},
            ),
            const SizedBox(height: AppSpacing.sm),
            const AppCard(child: Text('A simple bordered surface container.')),
            const SizedBox(height: AppSpacing.sm),
            AppCard(
              onTap: () {},
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.12),
                      borderRadius: AppRadius.mdR,
                    ),
                    child: const Icon(
                      Icons.touch_app_rounded,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Tappable card', style: tt.titleSmall),
                        Text(
                          'Ripple feedback on press',
                          style: tt.bodySmall?.copyWith(
                            color: cs.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(Icons.chevron_right_rounded, color: cs.onSurfaceVariant),
                ],
              ),
            ),
          ]),

          _section('Switch & Checkbox', [
            AppSwitchTile(
              title: 'Email notifications',
              subtitle: 'Receive updates by email',
              icon: Icons.mail_outline_rounded,
              value: _switchValue,
              onChanged: (v) => setState(() => _switchValue = v),
            ),
            const SizedBox(height: AppSpacing.sm),
            AppCheckbox(
              label: 'I agree to the terms and conditions',
              value: _checkboxValue,
              onChanged: (v) => setState(() => _checkboxValue = v),
            ),
          ]),

          _section('Radio group', [
            AppRadioGroup<String>(
              value: _radioValue,
              onChanged: (v) => setState(() => _radioValue = v),
              options: const [
                AppRadioOption(
                  value: 'light',
                  label: 'Light',
                  subtitle: 'Always use light theme',
                  icon: Icons.light_mode_rounded,
                ),
                AppRadioOption(
                  value: 'dark',
                  label: 'Dark',
                  subtitle: 'Always use dark theme',
                  icon: Icons.dark_mode_rounded,
                ),
                AppRadioOption(
                  value: 'system',
                  label: 'System',
                  subtitle: 'Match device settings',
                  icon: Icons.settings_suggest_rounded,
                ),
              ],
            ),
          ]),

          _section('Chips', [
            AppChipGroup<String>(
              value: _chipValue,
              onChanged: (v) => setState(() => _chipValue = v),
              options: const [
                (value: 'all', label: 'All'),
                (value: 'active', label: 'Active'),
                (value: 'archived', label: 'Archived'),
                (value: 'draft', label: 'Draft'),
              ],
            ),
          ]),

          _section('Segmented control', [
            AppSegmented<String>(
              value: _segmentValue,
              onChanged: (v) => setState(() => _segmentValue = v),
              segments: const [
                AppSegment(value: 'overview', label: 'Overview'),
                AppSegment(value: 'activity', label: 'Activity'),
                AppSegment(value: 'settings', label: 'Settings'),
              ],
            ),
          ]),

          _section('Progress & Spinner', const [
            AppProgress(value: 0.45),
            SizedBox(height: AppSpacing.md),
            AppProgress(),
            SizedBox(height: AppSpacing.lg),
            AppSpinner(label: 'Loading…'),
          ]),

          _section('Skeleton & loading', [
            if (_showSkeletonPreview) ...[
              const SkeletonListTile(),
              const SkeletonListTile(),
              const SizedBox(height: AppSpacing.sm),
              const SkeletonCard(),
              const SizedBox(height: AppSpacing.md),
              AppButton(
                label: 'Hide skeleton preview',
                variant: AppButtonVariant.outline,
                size: AppButtonSize.small,
                onPressed: () => setState(() => _showSkeletonPreview = false),
              ),
            ] else
              AppButton(
                label: 'Show skeleton preview',
                variant: AppButtonVariant.outline,
                size: AppButtonSize.small,
                onPressed: () => setState(() => _showSkeletonPreview = true),
              ),
            const SizedBox(height: AppSpacing.lg),
            AppSkeleton.line(width: 200),
            const SizedBox(height: AppSpacing.sm),
            AppSkeleton.line(width: double.infinity, height: 10),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                AppSkeleton.circle(size: 44),
                const SizedBox(width: AppSpacing.md),
                Expanded(child: AppSkeleton.box(height: 44)),
              ],
            ),
          ]),

          _section('Empty & error states', [
            AppCard(
              child: CenterMessage(
                icon: Icons.inbox_outlined,
                title: 'No items yet',
                body: 'Create your first item to get started.',
                action: AppButton(
                  label: 'Create item',
                  size: AppButtonSize.small,
                  fullWidth: false,
                  onPressed: _noop,
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            AppCard(
              child: AppErrorView(
                error: Exception('Network request timed out'),
                onRetry: _noop,
              ),
            ),
          ]),

          _section('Activity feed', [
            _ActivityItem(
              avatarName: 'Jordan Lee',
              title: 'Commented on Atlas',
              body: 'Looks good — ship it after QA sign-off.',
              time: '2m ago',
              badge: AppBadge.status('ACTIVE'),
            ),
            const SizedBox(height: AppSpacing.sm),
            _ActivityItem(
              avatarName: 'Sam Rivera',
              title: 'Uploaded attachment',
              body: 'wireframes-v3.fig',
              time: '1h ago',
              badge: const AppBadge(label: 'File', tone: AppBadgeTone.info),
            ),
            const SizedBox(height: AppSpacing.sm),
            _ActivityItem(
              avatarName: 'Taylor Kim',
              title: 'Changed project status',
              body: 'Moved from Draft to In review',
              time: 'Yesterday',
              badge: AppBadge.status('PENDING'),
            ),
          ]),

          _section('Divider', const [
            Text('Above'),
            AppDivider(label: 'OR'),
            Text('Below'),
          ]),

          _section('Overlays & feedback', [
            AppButton(
              label: 'Show confirm dialog',
              variant: AppButtonVariant.outline,
              onPressed: () => showConfirmDialog(
                context,
                title: 'Delete item?',
                message: 'This action cannot be undone.',
                confirmLabel: 'Delete',
                destructive: true,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            AppButton(
              label: 'Show bottom sheet',
              variant: AppButtonVariant.outline,
              onPressed: () => showAppBottomSheet<void>(
                context,
                title: 'Bottom sheet',
                builder: (ctx) => Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const AppAlert(
                      message: 'Sheets are great for contextual actions.',
                    ),
                    const SizedBox(height: AppSpacing.md),
                    AppButton(
                      label: 'Close',
                      onPressed: () => Navigator.of(ctx).pop(),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                Expanded(
                  child: AppButton(
                    label: 'Success',
                    size: AppButtonSize.small,
                    onPressed: () =>
                        showSuccessSnackBar(context, 'Saved successfully'),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: AppButton(
                    label: 'Error',
                    size: AppButtonSize.small,
                    variant: AppButtonVariant.danger,
                    onPressed: () =>
                        showErrorSnackBar(context, 'Something went wrong'),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: AppButton(
                    label: 'Info',
                    size: AppButtonSize.small,
                    variant: AppButtonVariant.secondary,
                    onPressed: () =>
                        showInfoSnackBar(context, 'Just so you know'),
                  ),
                ),
              ],
            ),
          ]),

          const SizedBox(height: AppSpacing.xxl),
        ],
      ),
    );
  }

  Widget _section(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: AppSpacing.lg),
        AppSectionHeader(title: title.toUpperCase()),
        const SizedBox(height: AppSpacing.sm),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.base),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: children,
          ),
        ),
      ],
    );
  }
}

void _noop() {}

const _featureCards = [
  (
    title: 'Projects',
    subtitle: '12 active',
    icon: Icons.folder_rounded,
    color: AppColors.cardProjects,
  ),
  (
    title: 'Alerts',
    subtitle: '3 unread',
    icon: Icons.notifications_rounded,
    color: AppColors.cardNotifications,
  ),
  (
    title: 'Profile',
    subtitle: 'Complete',
    icon: Icons.person_rounded,
    color: AppColors.cardProfile,
  ),
  (
    title: 'Admin',
    subtitle: 'Tools',
    icon: Icons.admin_panel_settings_rounded,
    color: AppColors.cardAdmin,
  ),
];

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.isDark, required this.textTheme});

  final bool isDark;
  final TextTheme textTheme;

  @override
  Widget build(BuildContext context) {
    final muted = isDark
        ? AppColors.onSurfaceMutedDark
        : AppColors.onSurfaceMutedLight;

    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const AppAvatar(name: 'Design System', size: 48),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Component library', style: textTheme.titleMedium),
                    Text(
                      'Tap through sections to preview tokens & widgets.',
                      style: textTheme.bodySmall?.copyWith(color: muted),
                    ),
                  ],
                ),
              ),
              const AppBadge(label: 'v1.0', tone: AppBadgeTone.primary),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          const Row(
            children: [
              Expanded(
                child: _StatItem(label: 'Components', value: '24'),
              ),
              Expanded(
                child: _StatItem(label: 'Tokens', value: '48'),
              ),
              Expanded(
                child: _StatItem(label: 'Screens', value: '12'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  const _StatItem({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;

    return Column(
      children: [
        Text(value, style: tt.headlineSmall),
        Text(label, style: tt.bodySmall?.copyWith(color: muted)),
      ],
    );
  }
}

class _TypographyRow extends StatelessWidget {
  const _TypographyRow({required this.label, required this.style});

  final String label;
  final TextStyle? style;

  @override
  Widget build(BuildContext context) {
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.labelSmall?.copyWith(color: muted, letterSpacing: 0.4),
          ),
          const SizedBox(height: 2),
          Text('The quick brown fox', style: style),
        ],
      ),
    );
  }
}

class _ColorSwatch extends StatelessWidget {
  const _ColorSwatch({
    required this.label,
    required this.color,
    this.foreground = Colors.white,
  });

  final String label;
  final Color color;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: color,
            borderRadius: AppRadius.mdR,
            border: Border.all(
              color: Theme.of(context).colorScheme.outlineVariant,
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            label[0],
            style: TextStyle(color: foreground, fontWeight: FontWeight.w700),
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(label, style: Theme.of(context).textTheme.labelSmall),
      ],
    );
  }
}

class _FeatureCard extends StatelessWidget {
  const _FeatureCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;

    return SizedBox(
      width: 148,
      child: AppCard(
        onTap: () {},
        padding: const EdgeInsets.all(AppSpacing.base),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: AppRadius.mdR,
              ),
              child: Icon(icon, size: 20, color: color),
            ),
            const Spacer(),
            Text(title, style: tt.titleSmall, maxLines: 1),
            Text(
              subtitle,
              style: tt.bodySmall?.copyWith(color: muted),
              maxLines: 1,
            ),
          ],
        ),
      ),
    );
  }
}

class _ActivityItem extends StatelessWidget {
  const _ActivityItem({
    required this.avatarName,
    required this.title,
    required this.body,
    required this.time,
    required this.badge,
  });

  final String avatarName;
  final String title;
  final String body;
  final String time;
  final AppBadge badge;

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;

    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.base),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AppAvatar(name: avatarName, size: 36),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: tt.titleSmall,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Text(time, style: tt.labelSmall?.copyWith(color: muted)),
                  ],
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  body,
                  style: tt.bodySmall?.copyWith(color: muted),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: AppSpacing.sm),
                badge,
              ],
            ),
          ),
        ],
      ),
    );
  }
}
