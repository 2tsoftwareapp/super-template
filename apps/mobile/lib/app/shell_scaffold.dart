import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Persistent shell that wraps the main tabs with a Material 3 [NavigationBar].
class ShellScaffold extends StatelessWidget {
  const ShellScaffold({required this.navigationShell, super.key});

  final StatefulNavigationShell navigationShell;

  static const _tabs = [
    _TabItem(
      label: 'Home',
      icon: Icons.home_outlined,
      activeIcon: Icons.home_rounded,
    ),
    _TabItem(
      label: 'Projects',
      icon: Icons.folder_outlined,
      activeIcon: Icons.folder_rounded,
    ),
    _TabItem(
      label: 'Notifications',
      icon: Icons.notifications_outlined,
      activeIcon: Icons.notifications_rounded,
    ),
    _TabItem(
      label: 'UI Kit',
      icon: Icons.widgets_outlined,
      activeIcon: Icons.widgets_rounded,
    ),
    _TabItem(
      label: 'Profile',
      icon: Icons.person_outline_rounded,
      activeIcon: Icons.person_rounded,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: (index) => _onTap(context, index),
        labelBehavior: NavigationDestinationLabelBehavior.onlyShowSelected,
        destinations: _tabs
            .map(
              (t) => NavigationDestination(
                icon: Icon(t.icon),
                selectedIcon: Icon(t.activeIcon),
                label: t.label,
              ),
            )
            .toList(),
      ),
    );
  }

  void _onTap(BuildContext context, int index) {
    // Defer navigation to the next frame so NavigationBar semantics/layout
    // can settle first (avoids parentDataDirty assertions on tab switch).
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!context.mounted) return;

      navigationShell.goBranch(
        index,
        initialLocation: index == navigationShell.currentIndex,
      );
    });
  }
}

class _TabItem {
  const _TabItem({
    required this.label,
    required this.icon,
    required this.activeIcon,
  });

  final String label;
  final IconData icon;
  final IconData activeIcon;
}
