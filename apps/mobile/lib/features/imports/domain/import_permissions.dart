/// Import feature permission flags derived from the session grant list.
class ImportPermissions {
  const ImportPermissions({required this.canRead, required this.canCreate});

  final bool canRead;
  final bool canCreate;
}

/// Maps raw session permissions to import feature capabilities.
ImportPermissions selectImportPermissions(Iterable<String> permissions) {
  final granted = permissions.toSet();
  return ImportPermissions(
    canRead: granted.contains('imports.read'),
    canCreate: granted.contains('imports.create'),
  );
}
