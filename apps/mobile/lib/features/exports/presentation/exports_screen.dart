import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/features/auth/presentation/auth_controller.dart';
import 'package:mobile_app/features/exports/data/exports_repository.dart';
import 'package:mobile_app/features/exports/domain/export_permissions.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:uuid/uuid.dart';

class ExportsScreen extends ConsumerStatefulWidget {
  const ExportsScreen({super.key});

  @override
  ConsumerState<ExportsScreen> createState() => _ExportsScreenState();
}

class _ExportsScreenState extends ConsumerState<ExportsScreen> {
  ExportJobSummary? _job;
  Timer? _pollTimer;
  bool _working = false;

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final permissions = selectExportPermissions(
      ref.watch(authControllerProvider).valueOrNull?.permissions ?? const [],
    );

    if (!permissions.canRead) {
      return Scaffold(
        appBar: AppBar(title: const Text('Exports')),
        body: const Center(child: Text('Missing exports.read permission')),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Exports')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            FilledButton.icon(
              onPressed: _working || !permissions.canCreate ? null : _startExport,
              icon: const Icon(Icons.download),
              label: const Text('Export data CSV'),
            ),
            const SizedBox(height: 24),
            if (_job != null) ...[
              Text(
                'Job ${_job!.id}',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text('Status: ${_job!.status}'),
              const SizedBox(height: 16),
              if (_job!.status == 'COMPLETED' && _job!.fileId != null)
                FilledButton(
                  onPressed: _working ? null : _openExport,
                  child: const Text('Open export file'),
                ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _startExport() async {
    setState(() => _working = true);
    try {
      final job = await ref
          .read(exportsRepositoryProvider)
          .create(type: 'users', idempotencyKey: const Uuid().v4());
      setState(() => _job = job);
      _pollTimer?.cancel();
      _pollTimer = Timer.periodic(
        const Duration(seconds: 2),
        (_) => _pollStatus(),
      );
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.toString())));
      }
    } finally {
      if (mounted) {
        setState(() => _working = false);
      }
    }
  }

  Future<void> _pollStatus() async {
    final job = _job;
    if (job == null) {
      return;
    }
    try {
      final latest = await ref.read(exportsRepositoryProvider).getById(job.id);
      if (!mounted) {
        return;
      }
      setState(() => _job = latest);
      if (latest.status == 'COMPLETED' ||
          latest.status == 'FAILED' ||
          latest.status == 'CANCELLED') {
        _pollTimer?.cancel();
      }
    } catch (_) {
      _pollTimer?.cancel();
    }
  }

  Future<void> _openExport() async {
    final fileId = _job?.fileId;
    if (fileId == null) {
      return;
    }
    setState(() => _working = true);
    try {
      final url = await ref.read(exportsRepositoryProvider).getFileUrl(fileId);
      final uri = Uri.parse(url);
      if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
        throw Exception('Could not open export URL');
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.toString())));
      }
    } finally {
      if (mounted) {
        setState(() => _working = false);
      }
    }
  }
}
