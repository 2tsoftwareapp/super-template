import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/core/widgets/async_screen_body.dart';
import 'package:mobile_app/core/widgets/state_views.dart';
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

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final orgs = ref.watch(organizationsListProvider);
    final auth = ref.watch(authControllerProvider).valueOrNull;
    final repository = ref.read(organizationsRepositoryProvider);

    if (auth == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Organizations')),
        body: CenterMessage(
          title: 'Sign in required',
          body: 'Switch organizations after signing in.',
          action: FilledButton(
            onPressed: () => context.go('/login'),
            child: const Text('Sign in'),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Organizations')),
      body: AsyncScreenBody(
        value: orgs,
        isEmpty: (rows) => rows.isEmpty,
        empty: const CenterMessage(title: 'No organizations yet'),
        data: (rows) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            ...rows.map(
              (org) => Card(
                child: ListTile(
                  title: Text(org.name),
                  subtitle: Text('${org.slug} · ${org.role}'),
                  trailing: org.isCurrent
                      ? const Chip(label: Text('Current'))
                      : TextButton(
                          onPressed: () async {
                            await ref
                                .read(authControllerProvider.notifier)
                                .switchOrganization(org.id);
                            ref.invalidate(organizationsListProvider);
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Switched to ${org.name}'),
                                ),
                              );
                            }
                          },
                          child: const Text('Switch'),
                        ),
                  onTap: () => context.go('/organizations/${org.id}'),
                ),
              ),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Organization name'),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () async {
                await repository.create(name: _nameController.text.trim());
                _nameController.clear();
                ref.invalidate(organizationsListProvider);
              },
              child: const Text('Create organization'),
            ),
          ],
        ),
      ),
    );
  }
}
