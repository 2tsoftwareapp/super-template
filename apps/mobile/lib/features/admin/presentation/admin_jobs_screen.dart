import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/features/admin/data/admin_repository.dart';
import 'package:mobile_app/features/auth/presentation/auth_controller.dart';

class AdminJobsScreen extends ConsumerStatefulWidget {
  const AdminJobsScreen({super.key});

  @override
  ConsumerState<AdminJobsScreen> createState() => _AdminJobsScreenState();
}

class _AdminJobsScreenState extends ConsumerState<AdminJobsScreen> {
  int _refreshKey = 0;

  @override
  Widget build(BuildContext context) {
    final permissions =
        ref.watch(authControllerProvider).valueOrNull?.permissions ?? [];
    final canRead = permissions.contains('jobs.read');
    final canManage = permissions.contains('jobs.update');

    if (!canRead) {
      return Scaffold(
        appBar: AppBar(title: const Text('Jobs')),
        body: const Center(child: Text('Missing jobs.read permission')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Jobs'),
        actions: [
          IconButton(
            onPressed: () => setState(() => _refreshKey++),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: FutureBuilder(
        key: ValueKey(_refreshKey),
        future: ref.read(adminRepositoryProvider).listJobs(),
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text(snapshot.error.toString()));
          }
          final jobs = snapshot.data ?? [];
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: jobs.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final job = jobs[index];
              return ListTile(
                title: Text(job.type),
                subtitle: Text('${job.status} · ${job.createdAt}'),
                trailing: canManage && job.status != 'CANCELLED'
                    ? IconButton(
                        icon: const Icon(Icons.cancel),
                        onPressed: () async {
                          await ref
                              .read(adminRepositoryProvider)
                              .cancelJob(job.id);
                          if (context.mounted) {
                            setState(() => _refreshKey++);
                          }
                        },
                      )
                    : null,
              );
            },
          );
        },
      ),
    );
  }
}
