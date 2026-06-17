import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/features/auth/presentation/auth_controller.dart';

class AdminHubScreen extends ConsumerWidget {
  const AdminHubScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final permissions =
        ref.watch(authControllerProvider).valueOrNull?.permissions ??
        const <String>[];

    final tiles =
        <({String title, IconData icon, String route, String permission})>[
          (
            title: 'Users',
            icon: Icons.people,
            route: '/admin/users',
            permission: 'users.read',
          ),
          (
            title: 'Roles',
            icon: Icons.badge,
            route: '/admin/roles',
            permission: 'roles.read',
          ),
          (
            title: 'Jobs',
            icon: Icons.work,
            route: '/admin/jobs',
            permission: 'jobs.read',
          ),
          (
            title: 'Mail',
            icon: Icons.mail,
            route: '/admin/mail',
            permission: 'mail.read',
          ),
          (
            title: 'Settings',
            icon: Icons.settings,
            route: '/admin/settings',
            permission: 'settings.read',
          ),
          (
            title: 'Notifications',
            icon: Icons.campaign,
            route: '/admin/notifications',
            permission: 'notifications.send',
          ),
          (
            title: 'Audit logs',
            icon: Icons.history,
            route: '/admin/audit-logs',
            permission: 'audit.read',
          ),
        ];

    final visibleTiles = tiles
        .where((tile) => permissions.contains(tile.permission))
        .toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Admin')),
      body: visibleTiles.isEmpty
          ? const Center(child: Text('No admin permissions'))
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: visibleTiles.length,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final tile = visibleTiles[index];
                return Card(
                  child: ListTile(
                    leading: Icon(tile.icon),
                    title: Text(tile.title),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.go(tile.route),
                  ),
                );
              },
            ),
    );
  }
}
