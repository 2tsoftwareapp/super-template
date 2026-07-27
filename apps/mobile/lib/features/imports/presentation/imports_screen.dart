import 'dart:async';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/features/auth/presentation/auth_controller.dart';
import 'package:mobile_app/features/imports/data/imports_repository.dart';
import 'package:mobile_app/features/imports/domain/import_permissions.dart';
import 'package:super_template_api/super_template_api.dart';
import 'package:uuid/uuid.dart';

class ImportsScreen extends ConsumerStatefulWidget {
  const ImportsScreen({super.key});

  @override
  ConsumerState<ImportsScreen> createState() => _ImportsScreenState();
}

class _ImportsScreenState extends ConsumerState<ImportsScreen> {
  ImportJobSummary? _job;
  Timer? _pollTimer;
  bool _working = false;

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final permissions = selectImportPermissions(
      ref.watch(authControllerProvider).valueOrNull?.permissions ?? const [],
    );

    if (!permissions.canRead) {
      return Scaffold(
        appBar: AppBar(title: const Text('Imports')),
        body: const Center(child: Text('Missing imports.read permission')),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Imports')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            FilledButton.icon(
              onPressed: _working || !permissions.canCreate ? null : _startImport,
              icon: const Icon(Icons.upload_file),
              label: const Text('Pick CSV and import data'),
            ),
            const SizedBox(height: 24),
            if (_job != null) ...[
              Text(
                'Job ${_job!.id}',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text('Status: ${_job!.status}'),
              if (_job!.rowCount != null)
                Text(
                  'Rows: ${_job!.rowCount} · OK: ${_job!.successCount} · Errors: ${_job!.errorCount}',
                ),
              const SizedBox(height: 16),
              if (_job!.status == 'COMPLETED')
                FilledButton(
                  onPressed: _working ? null : _confirmImport,
                  child: const Text('Confirm import'),
                ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _startImport() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['csv'],
    );
    final path = result?.files.single.path;
    if (path == null) {
      return;
    }

    setState(() => _working = true);
    try {
      final repository = ref.read(importsRepositoryProvider);
      final fileId = await repository.uploadFile(
        path,
        result!.files.single.name,
      );
      final job = await repository.create(
        type: CreateImportDtoTypeEnum.users,
        fileId: fileId,
        idempotencyKey: const Uuid().v4(),
      );
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
      final latest = await ref.read(importsRepositoryProvider).getById(job.id);
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

  Future<void> _confirmImport() async {
    final job = _job;
    if (job == null) {
      return;
    }
    setState(() => _working = true);
    try {
      final confirmed = await ref
          .read(importsRepositoryProvider)
          .confirm(job.id);
      setState(() => _job = confirmed);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Import confirmed')));
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
