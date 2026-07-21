/// Export feature permission flags derived from the session grant list.
class ExportPermissions {
  const ExportPermissions({required this.canRead, required this.canCreate});

  final bool canRead;
  final bool canCreate;
}

/// Maps raw session permissions to export feature capabilities.
ExportPermissions selectExportPermissions(Iterable<String> permissions) {
  final granted = permissions.toSet();
  return ExportPermissions(
    canRead: granted.contains('exports.read'),
    canCreate: granted.contains('exports.create'),
  );
}
