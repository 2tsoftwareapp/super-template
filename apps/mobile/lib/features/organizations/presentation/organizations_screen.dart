import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/core/design/app_colors.dart';
import 'package:mobile_app/core/design/app_spacing.dart';
import 'package:mobile_app/core/widgets/widgets.dart';
import 'package:mobile_app/features/auth/presentation/auth_controller.dart';
import 'package:mobile_app/features/organizations/data/organizations_repository.dart';

class OrganizationsScreen extends ConsumerStatefulWidget {
  const OrganizationsScreen({super.key});

  @override
  ConsumerState<OrganizationsScreen> createState() =>
      _OrganizationsScreenState();
}

class _OrganizationsScreenState extends ConsumerState<OrganizationsScreen> {
  final _nameController = TextEditingController();
  bool _creating = false;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _switchOrg(String id, String name) async {
    try {
      await ref.read(authControllerProvider.notifier).switchOrganization(id);
      ref.invalidate(organizationsListProvider);
      if (mounted) showSuccessSnackBar(context, 'Switched to $name');
    } catch (e) {
      if (mounted) showErrorSnackBar(context, e);
    }
  }

  Future<void> _create() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) return;
    setState(() => _creating = true);
    try {
      await ref.read(organizationsRepositoryProvider).create(name: name);
      _nameController.clear();
      ref.invalidate(organizationsListProvider);
      if (mounted) showSuccessSnackBar(context, 'Organization created');
    } catch (e) {
      if (mounted) showErrorSnackBar(context, e);
    } finally {
      if (mounted) setState(() => _creating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final orgs = ref.watch(organizationsListProvider);
    final auth = ref.watch(authControllerProvider).valueOrNull;

    if (auth == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Organizations')),
        body: CenterMessage(
          title: 'Sign in required',
          body: 'Switch organizations after signing in.',
          action: AppButton(
            label: 'Sign in',
            fullWidth: false,
            onPressed: () => context.go('/login'),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Organizations')),
      body: AsyncScreenBody(
        value: orgs,
        isEmpty: (rows) => rows.isEmpty,
        empty: const CenterMessage(
          icon: Icons.business_rounded,
          title: 'No organizations yet',
          body: 'Create your first organization below.',
        ),
        data: (rows) => ListView(
          padding: const EdgeInsets.all(AppSpacing.base),
          children: [
            ...rows.map(
              (org) => Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: AppListTile(
                  icon: Icons.business_rounded,
                  iconColor: AppColors.cardOrganizations,
                  title: org.name,
                  subtitle: '${org.slug} · ${org.role}',
                  trailing: org.isCurrent
                      ? const AppBadge(
                          label: 'CURRENT',
                          tone: AppBadgeTone.success,
                        )
                      : TextButton(
                          onPressed: () => _switchOrg(org.id, org.name),
                          child: const Text('Switch'),
                        ),
                  onTap: () => context.push('/organizations/${org.id}'),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            AppTextField(
              controller: _nameController,
              label: 'New organization',
              hint: 'Organization name',
              prefixIcon: Icons.add_business_rounded,
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _create(),
            ),
            const SizedBox(height: AppSpacing.base),
            AppButton(
              label: 'Create organization',
              icon: Icons.add_rounded,
              loading: _creating,
              onPressed: _create,
            ),
          ],
        ),
      ),
    );
  }
}
