import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/app/shell_scaffold.dart';
import 'package:mobile_app/features/gallery/presentation/gallery_screen.dart';
import 'package:mobile_app/features/home/presentation/home_screen.dart';
import 'package:mobile_app/features/notifications/presentation/notifications_screen.dart';
import 'package:mobile_app/features/profile/presentation/profile_screen.dart';
import 'package:mobile_app/features/projects/presentation/projects_screen.dart';

void main() {
  testWidgets('UI Kit tab shows gallery content', (tester) async {
    final homeKey = GlobalKey<NavigatorState>(debugLabel: 'home');
    final projectsKey = GlobalKey<NavigatorState>(debugLabel: 'projects');
    final notifKey = GlobalKey<NavigatorState>(debugLabel: 'notif');
    final galleryKey = GlobalKey<NavigatorState>(debugLabel: 'gallery');
    final profileKey = GlobalKey<NavigatorState>(debugLabel: 'profile');

    final router = GoRouter(
      initialLocation: '/home',
      routes: [
        StatefulShellRoute.indexedStack(
          builder: (_, _, navigationShell) =>
              ShellScaffold(navigationShell: navigationShell),
          branches: [
            StatefulShellBranch(
              navigatorKey: homeKey,
              routes: [
                GoRoute(path: '/home', builder: (_, _) => const HomeScreen()),
              ],
            ),
            StatefulShellBranch(
              navigatorKey: projectsKey,
              routes: [
                GoRoute(
                  path: '/projects',
                  builder: (_, _) => const ProjectsScreen(),
                ),
              ],
            ),
            StatefulShellBranch(
              navigatorKey: notifKey,
              routes: [
                GoRoute(
                  path: '/notifications',
                  builder: (_, _) => const NotificationsScreen(),
                ),
              ],
            ),
            StatefulShellBranch(
              navigatorKey: galleryKey,
              routes: [
                GoRoute(
                  path: '/gallery',
                  builder: (_, _) => const GalleryScreen(),
                ),
              ],
            ),
            StatefulShellBranch(
              navigatorKey: profileKey,
              routes: [
                GoRoute(
                  path: '/profile',
                  builder: (_, _) => const ProfileScreen(),
                ),
              ],
            ),
          ],
        ),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(child: MaterialApp.router(routerConfig: router)),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('UI Kit'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    await tester.pumpAndSettle();

    expect(find.text('Component library'), findsOneWidget);
    expect(find.text('TYPOGRAPHY'), findsOneWidget);

    await tester.scrollUntilVisible(
      find.text('BUTTONS'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();

    expect(find.text('BUTTONS'), findsOneWidget);
    expect(find.text('Primary'), findsOneWidget);
  });
}
