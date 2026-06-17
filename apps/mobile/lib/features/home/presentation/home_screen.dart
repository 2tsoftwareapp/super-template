import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/app/theme.dart';
import 'package:mobile_app/features/auth/presentation/auth_controller.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider).valueOrNull;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Super Template'),
        actions: [
          IconButton(
            onPressed: () => ref.read(themeModeProvider.notifier).toggle(),
            icon: const Icon(Icons.contrast),
          ),
          IconButton(
            onPressed: () async {
              await ref.read(authControllerProvider.notifier).logout();
              if (context.mounted) {
                context.go('/login');
              }
            },
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    authState?.displayName ?? 'Guest',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  Text(authState?.email ?? ''),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          _NavTile(
            title: 'Projects',
            icon: Icons.folder_open,
            onTap: () => context.go('/projects'),
          ),
          _NavTile(
            title: 'Notifications',
            icon: Icons.notifications,
            onTap: () => context.go('/notifications'),
          ),
          _NavTile(
            title: 'Profile',
            icon: Icons.person,
            onTap: () => context.go('/profile'),
          ),
          _NavTile(
            title: 'Preferences',
            icon: Icons.tune,
            onTap: () => context.go('/preferences'),
          ),
          _NavTile(
            title: 'Security',
            icon: Icons.lock,
            onTap: () => context.go('/security'),
          ),
          _NavTile(
            title: 'Sessions',
            icon: Icons.devices,
            onTap: () => context.go('/sessions'),
          ),
          _NavTile(
            title: 'Organizations',
            icon: Icons.business,
            onTap: () => context.go('/organizations'),
          ),
          if (authState?.permissions.contains('imports.manage') ?? false)
            _NavTile(
              title: 'Imports',
              icon: Icons.upload,
              onTap: () => context.go('/imports'),
            ),
          if (authState?.permissions.contains('exports.manage') ?? false)
            _NavTile(
              title: 'Exports',
              icon: Icons.download,
              onTap: () => context.go('/exports'),
            ),
          if (_hasAdminAccess(authState?.permissions ?? const []))
            _NavTile(
              title: 'Admin',
              icon: Icons.admin_panel_settings,
              onTap: () => context.go('/admin'),
            ),
        ],
      ),
    );
  }
}

bool _hasAdminAccess(List<String> permissions) {
  const adminPermissions = {
    'users.read',
    'roles.read',
    'jobs.read',
    'mail.read',
    'settings.read',
    'notifications.send',
    'audit.read',
  };
  return permissions.any(adminPermissions.contains);
}

class _NavTile extends StatelessWidget {
  const _NavTile({
    required this.title,
    required this.icon,
    required this.onTap,
  });

  final String title;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(icon),
        title: Text(title),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
