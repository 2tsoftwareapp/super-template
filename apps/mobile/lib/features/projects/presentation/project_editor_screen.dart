import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/design/app_colors.dart';
import 'package:mobile_app/core/design/app_radius.dart';
import 'package:mobile_app/core/design/app_spacing.dart';
import 'package:mobile_app/core/widgets/widgets.dart';
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
  bool _saving = false;
  String? _loadError;

  bool get _isEdit => widget.projectId != null;

  @override
  void initState() {
    super.initState();
    if (_isEdit) {
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
      if (!mounted) return;
      _nameController.text = project.name;
      _descriptionController.text = project.description ?? '';
      _status = project.status;
      setState(() {
        _loaded = true;
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;
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

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final repo = ref.read(projectsRepositoryProvider);
      final name = _nameController.text.trim();
      final desc = _descriptionController.text.trim().isEmpty
          ? null
          : _descriptionController.text.trim();

      if (!_isEdit) {
        await repo.create(name: name, description: desc, status: _status);
      } else {
        await repo.update(
          id: widget.projectId!,
          name: name,
          description: desc,
          status: _status,
        );
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      showErrorSnackBar(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final title = _isEdit ? 'Edit project' : 'New project';

    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: Text(title)),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_loadError != null) {
      return Scaffold(
        appBar: AppBar(title: Text(title)),
        body: AppErrorView(error: _loadError!, onRetry: _preloadProject),
      );
    }

    if (!_loaded) {
      return Scaffold(
        appBar: AppBar(title: Text(title)),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      backgroundColor: isDark
          ? AppColors.backgroundDark
          : AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: isDark
            ? AppColors.backgroundDark
            : AppColors.backgroundLight,
        title: Text(title),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.base),
          children: [
            // ── Name ──────────────────────────────────────────────────────
            _SectionLabel('Project name'),
            const SizedBox(height: AppSpacing.xs),
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(
                hintText: 'e.g. Mobile redesign',
                prefixIcon: Icon(Icons.folder_open_rounded),
              ),
              textCapitalization: TextCapitalization.sentences,
              textInputAction: TextInputAction.next,
              validator: (v) =>
                  (v?.trim().length ?? 0) >= 2 ? null : 'Name too short',
            ),

            const SizedBox(height: AppSpacing.lg),

            // ── Description ───────────────────────────────────────────────
            _SectionLabel('Description'),
            const SizedBox(height: AppSpacing.xs),
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(
                hintText: 'What is this project about? (optional)',
                prefixIcon: Icon(Icons.notes_rounded),
                alignLabelWithHint: true,
              ),
              textCapitalization: TextCapitalization.sentences,
              maxLines: 4,
              minLines: 3,
            ),

            const SizedBox(height: AppSpacing.lg),

            // ── Status ────────────────────────────────────────────────────
            _SectionLabel('Status'),
            const SizedBox(height: AppSpacing.xs),
            _StatusPicker(
              value: _status,
              onChanged: (v) => setState(() => _status = v),
              isDark: isDark,
              cs: cs,
              tt: tt,
            ),

            const SizedBox(height: AppSpacing.xl),

            // ── Save button ───────────────────────────────────────────────
            AppButton(
              label: _isEdit ? 'Save changes' : 'Create project',
              loading: _saving,
              onPressed: _save,
            ),

            const SizedBox(height: AppSpacing.massive),
          ],
        ),
      ),
    );
  }
}

// ── Section Label ─────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.label);
  final String label;

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;
    return Text(
      label,
      style: tt.labelLarge?.copyWith(
        fontWeight: FontWeight.w600,
        color: cs.onSurfaceVariant,
      ),
    );
  }
}

// ── Status Picker ─────────────────────────────────────────────────────────────

class _StatusPicker extends StatelessWidget {
  const _StatusPicker({
    required this.value,
    required this.onChanged,
    required this.isDark,
    required this.cs,
    required this.tt,
  });

  final String value;
  final ValueChanged<String> onChanged;
  final bool isDark;
  final ColorScheme cs;
  final TextTheme tt;

  static const _options = [
    _StatusOption('DRAFT', 'Draft', Icons.edit_note_rounded, Color(0xFF6B7280)),
    _StatusOption(
      'ACTIVE',
      'Active',
      Icons.play_circle_rounded,
      Color(0xFF10B981),
    ),
    _StatusOption(
      'ARCHIVED',
      'Archived',
      Icons.archive_rounded,
      Color(0xFFF59E0B),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      children: _options.map((opt) {
        final selected = value == opt.value;
        return Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.sm),
          child: InkWell(
            onTap: () => onChanged(opt.value),
            borderRadius: AppRadius.mdR,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.base,
                vertical: AppSpacing.md,
              ),
              decoration: BoxDecoration(
                color: selected
                    ? opt.color.withValues(alpha: isDark ? 0.15 : 0.08)
                    : isDark
                    ? AppColors.surfaceContainerDark
                    : AppColors.surfaceLight,
                borderRadius: AppRadius.mdR,
                border: Border.all(
                  color: selected
                      ? opt.color.withValues(alpha: 0.6)
                      : isDark
                      ? AppColors.outlineVariantDark
                      : AppColors.outlineVariantLight,
                  width: selected ? 1.5 : 1,
                ),
              ),
              child: Row(
                children: [
                  Icon(opt.icon, size: 20, color: opt.color),
                  const SizedBox(width: AppSpacing.md),
                  Text(
                    opt.label,
                    style: tt.bodyMedium?.copyWith(
                      fontWeight: selected
                          ? FontWeight.w600
                          : FontWeight.normal,
                      color: selected ? opt.color : null,
                    ),
                  ),
                  const Spacer(),
                  if (selected)
                    Icon(
                      Icons.check_circle_rounded,
                      size: 18,
                      color: opt.color,
                    ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _StatusOption {
  const _StatusOption(this.value, this.label, this.icon, this.color);
  final String value;
  final String label;
  final IconData icon;
  final Color color;
}
