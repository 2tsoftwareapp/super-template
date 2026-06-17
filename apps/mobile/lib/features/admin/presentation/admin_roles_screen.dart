import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/features/admin/data/admin_repository.dart';
import 'package:mobile_app/features/auth/presentation/auth_controller.dart';

class AdminRolesScreen extends ConsumerWidget {
  const AdminRolesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final canRead =
        ref
            .watch(authControllerProvider)
            .valueOrNull
            ?.permissions
            .contains('roles.read') ??
        false;

    if (!canRead) {
      return Scaffold(
        appBar: AppBar(title: const Text('Roles')),
        body: const Center(child: Text('Missing roles.read permission')),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Roles')),
      body: FutureBuilder(
        future: ref.read(adminRepositoryProvider).listRoles(),
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text(snapshot.error.toString()));
          }
          final roles = snapshot.data ?? [];
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: roles.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final role = roles[index];
              return ListTile(
                title: Text(role.name),
                subtitle: Text(role.description),
              );
            },
          );
        },
      ),
    );
  }
}
