import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/features/projects/data/projects_repository.dart';

class ProjectEditorScreen extends ConsumerStatefulWidget {
  const ProjectEditorScreen({this.projectId, super.key});

  final String? projectId;

  @override
  ConsumerState<ProjectEditorScreen> createState() =>
      _ProjectEditorScreenState();
}

class _ProjectEditorScreenState extends ConsumerState<ProjectEditorScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  String _status = 'DRAFT';
  bool _loaded = false;
  bool _loading = false;
  String? _loadError;

  @override
  void initState() {
    super.initState();
    if (widget.projectId != null) {
      _preloadProject();
    } else {
      _loaded = true;
    }
  }

  Future<void> _preloadProject() async {
    setState(() {
      _loading = true;
      _loadError = null;
    });
    try {
      final project = await ref
          .read(projectsRepositoryProvider)
          .getById(widget.projectId!);
      if (!mounted) {
        return;
      }
      _nameController.text = project.name;
      _descriptionController.text = project.description ?? '';
      _status = project.status;
      setState(() {
        _loaded = true;
        _loading = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _loadError = error.toString();
        _loading = false;
      });
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(
          title: Text(
            widget.projectId == null ? 'Create project' : 'Edit project',
          ),
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_loadError != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Edit project')),
        body: Center(child: Text(_loadError!)),
      );
    }

    if (!_loaded) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.projectId == null ? 'Create project' : 'Edit project',
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Project name'),
                validator: (value) =>
                    (value?.trim().length ?? 0) >= 2 ? null : 'Too short',
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(labelText: 'Description'),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: _status,
                items: const [
                  DropdownMenuItem(value: 'DRAFT', child: Text('Draft')),
                  DropdownMenuItem(value: 'ACTIVE', child: Text('Active')),
                  DropdownMenuItem(value: 'ARCHIVED', child: Text('Archived')),
                ],
                onChanged: (value) =>
                    setState(() => _status = value ?? 'DRAFT'),
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: () async {
                  final router = GoRouter.of(context);
                  if (!_formKey.currentState!.validate()) {
                    return;
                  }
                  final repo = ref.read(projectsRepositoryProvider);
                  if (widget.projectId == null) {
                    await repo.create(
                      name: _nameController.text.trim(),
                      description: _descriptionController.text.trim().isEmpty
                          ? null
                          : _descriptionController.text.trim(),
                      status: _status,
                    );
                  } else {
                    await repo.update(
                      id: widget.projectId!,
                      name: _nameController.text.trim(),
                      description: _descriptionController.text.trim().isEmpty
                          ? null
                          : _descriptionController.text.trim(),
                      status: _status,
                    );
                  }
                  router.go('/projects');
                },
                child: const Text('Save'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
