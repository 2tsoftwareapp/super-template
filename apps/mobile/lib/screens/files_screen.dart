import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:material_ui/material_ui.dart';

import '../api.dart';
import '../models.dart';

/// Resolves to the picked file's name and bytes, or null when cancelled.
typedef PickFile = Future<(String, Uint8List)?> Function();

Future<(String, Uint8List)?> pickWithSystemDialog() async {
  final picked = await FilePicker.pickFiles(
    type: FileType.custom,
    allowedExtensions: uploadMimeTypes.keys.toList(),
  );
  if (picked.isEmpty) return null;

  final file = picked.first;
  return (file.name, await file.readAsBytes());
}

String formatBytes(int bytes) {
  if (bytes < 1024) return '$bytes B';
  if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
  return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
}

class FilesScreen extends StatefulWidget {
  const FilesScreen(
      {super.key, required this.api, this.pickFile = pickWithSystemDialog});

  final ApiClient api;
  final PickFile pickFile;

  @override
  State<FilesScreen> createState() => _FilesScreenState();
}

class _FilesScreenState extends State<FilesScreen> {
  List<StoredFile>? _files;
  bool _uploading = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final files = await widget.api.files();
      if (mounted) setState(() => _files = files);
    } on Exception catch (error) {
      _show(error.toString());
    }
  }

  Future<void> _upload() async {
    final picked = await widget.pickFile();
    if (picked == null) return;

    setState(() => _uploading = true);
    try {
      final file = await widget.api.upload(picked.$1, picked.$2);
      _show('Uploaded ${file.name}');
      await _load();
    } on Exception catch (error) {
      _show(error.toString());
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  void _show(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final files = _files;

    return Scaffold(
      appBar: AppBar(title: const Text('My files')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _uploading ? null : _upload,
        icon: _uploading
            ? const SizedBox.square(
                dimension: 18, child: CircularProgressIndicator())
            : const Icon(Icons.upload_file),
        label: const Text('Upload'),
      ),
      body: files == null
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(children: [
                if (files.isEmpty)
                  const ListTile(title: Text('No files yet. Tap Upload.')),
                for (final file in files)
                  ListTile(
                    leading: const Icon(Icons.insert_drive_file),
                    title: Text(file.name),
                    subtitle: Text(
                        '${file.mimeType} · ${formatBytes(file.sizeBytes)}'),
                  ),
              ]),
            ),
    );
  }
}
